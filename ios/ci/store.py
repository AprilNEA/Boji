#!/usr/bin/env python3
"""Three-layer App Store actions for the Boji CI workflow.

Plan mode is offline.  Apply mode is deliberately narrow: upload only uploads a
validated IPA, and submit only sends a pre-staged version with the receipt's
exact build ID.  This program never prints asc output.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib
import ipaddress
import json
import os
from pathlib import Path, PurePosixPath
import plistlib
import re
import socket
import stat
import subprocess
import sys
import tempfile
from typing import Any
from urllib import error as urlerror
from urllib import parse as urlparse
from urllib import request as urlrequest
import zipfile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
APP_STORE = ROOT / "ios" / "app-store"
if str(APP_STORE) not in sys.path:
    sys.path.insert(0, str(APP_STORE))

# Import through the existing app-store import path.  Do not duplicate its
# pinned-binary integrity check or metadata whitelist implementation.
install_asc = importlib.import_module("install_asc")
manage = importlib.import_module("manage")
verified_binary = install_asc.verified_binary

APP_ID = "6824964768"
BUNDLE_ID = "club.leanmuscle.boji"
PLATFORM = "IOS"
SCHEMA_VERSION = 1
MAX_IPA_BYTES = 4 * 1024 * 1024 * 1024
MAX_ZIP_MEMBERS = 10_000
MAX_UNCOMPRESSED_IPA_BYTES = 6 * 1024 * 1024 * 1024
MAX_JSON_BYTES = 64 * 1024
VERSION_RE = re.compile(r"\d+\.\d+(?:\.\d+)?")
BUILD_RE = re.compile(r"[1-9]\d{0,3}(?:\.\d{1,2}){0,2}")
# Apple resource IDs are opaque strings; version/build IDs can be UUIDs.
ID_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9._-]{0,127}")
COMMIT_RE = re.compile(r"[0-9a-fA-F]{40}")
SHA256_RE = re.compile(r"[0-9a-f]{64}")

# These are the three product bundles in a signed Boji IPA.  Extra framework
# Info.plists are allowed, but these exact product Info.plists must all exist.
IPA_PLISTS = {
    "Payload/Boji.app/Info.plist": BUNDLE_ID,
    "Payload/Boji.app/PlugIns/BojiWidgets.appex/Info.plist": f"{BUNDLE_ID}.widgets",
    "Payload/Boji.app/Watch/BojiWatch.app/Info.plist": f"{BUNDLE_ID}.watchkitapp",
}
REQUIRED_RECEIPT_FIELDS = {
    "schemaVersion",
    "appId",
    "bundleId",
    "version",
    "buildNumber",
    "buildId",
    "commit",
    "ipaSha256",
}
REQUIRED_APPROVAL_CHECKS = {
    "backend",
    "reviewAccess",
    "privacy",
    "legal",
    "screenshots",
    "exportCompliance",
}


class StoreError(RuntimeError):
    """A safe, user-actionable error that contains no asc response content."""


class AscCommandError(StoreError):
    """asc exited unsuccessfully; stdout and stderr remain private."""


class RemoteBuildError(StoreError):
    """An uploaded build could not be proven to be the requested build."""


def metadata_dir() -> Path:
    return ROOT / "ios" / "app-store" / "metadata"


def approval_path() -> Path:
    return ROOT / "ios" / "ci" / "release-approval.json"


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _require_text(value: Any, expression: re.Pattern[str], field: str) -> str:
    if not isinstance(value, str) or not expression.fullmatch(value):
        raise StoreError(f"收据字段不合法：{field}。")
    return value


def _json_object(path: Path, label: str) -> dict[str, Any]:
    """Read a small, ordinary JSON object and reject duplicate keys/symlinks."""
    try:
        file_stat = path.lstat()
    except OSError as exc:
        raise StoreError(f"缺少{label}。") from exc
    if stat.S_ISLNK(file_stat.st_mode) or not stat.S_ISREG(file_stat.st_mode):
        raise StoreError(f"{label}必须是普通文件。")
    if file_stat.st_size > MAX_JSON_BYTES:
        raise StoreError(f"{label}超过大小上限。")

    def unique_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise StoreError(f"{label}包含重复字段。")
            result[key] = value
        return result

    try:
        data = json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=unique_pairs)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise StoreError(f"{label}不是有效 JSON。") from exc
    if not isinstance(data, dict):
        raise StoreError(f"{label}顶层必须是对象。")
    return data


def read_receipt(path: Path) -> dict[str, Any]:
    """Read the exact, whitelisted TestFlight upload receipt format."""
    receipt = _json_object(path, "上传收据")
    if set(receipt) != REQUIRED_RECEIPT_FIELDS:
        raise StoreError("上传收据字段不符合白名单。")
    if type(receipt.get("schemaVersion")) is not int or receipt["schemaVersion"] != SCHEMA_VERSION:
        raise StoreError("上传收据 schemaVersion 不受支持。")
    if receipt.get("appId") != APP_ID or receipt.get("bundleId") != BUNDLE_ID:
        raise StoreError("上传收据的应用身份不匹配。")
    _require_text(receipt.get("version"), VERSION_RE, "version")
    _require_text(receipt.get("buildNumber"), BUILD_RE, "buildNumber")
    _require_text(receipt.get("buildId"), ID_RE, "buildId")
    _require_text(receipt.get("commit"), COMMIT_RE, "commit")
    _require_text(receipt.get("ipaSha256"), SHA256_RE, "ipaSha256")
    return receipt


def _validate_ipa_file(path: Path) -> None:
    try:
        file_stat = path.lstat()
    except OSError as exc:
        raise StoreError("IPA 不存在。") from exc
    if path.is_symlink() or not stat.S_ISREG(file_stat.st_mode):
        raise StoreError("IPA 必须是普通文件，不能是符号链接。")
    if file_stat.st_size <= 0 or file_stat.st_size > MAX_IPA_BYTES:
        raise StoreError("IPA 大小不在允许范围内。")
    if file_stat.st_mode & (stat.S_IWGRP | stat.S_IWOTH):
        raise StoreError("IPA 不能允许组或其他用户写入。")
    if hasattr(os, "getuid") and file_stat.st_uid != os.getuid():
        raise StoreError("IPA 所有者不是当前 CI 用户。")
    if file_stat.st_nlink != 1:
        raise StoreError("IPA 不能有多个硬链接。")
    if path.suffix.lower() != ".ipa":
        raise StoreError("上传文件必须使用 .ipa 后缀。")


def _validate_zip_members(archive: zipfile.ZipFile) -> None:
    members = archive.infolist()
    if len(members) > MAX_ZIP_MEMBERS:
        raise StoreError("IPA 包含过多文件。")
    if len({member.filename for member in members}) != len(members):
        raise StoreError("IPA 包含重复归档路径。")
    total_size = 0
    for member in members:
        member_path = PurePosixPath(member.filename)
        if member_path.is_absolute() or ".." in member_path.parts:
            raise StoreError("IPA 包含不安全的归档路径。")
        mode = member.external_attr >> 16
        if stat.S_ISLNK(mode):
            raise StoreError("IPA 不能包含符号链接。")
        if member.flag_bits & 0x1:
            raise StoreError("IPA 不能包含加密归档成员。")
        total_size += member.file_size
        if total_size > MAX_UNCOMPRESSED_IPA_BYTES:
            raise StoreError("IPA 解压后大小超过上限。")


def inspect_ipa(path: Path, version: str, build_number: str) -> str:
    """Verify the main app and both embedded product bundles before upload."""
    _validate_ipa_file(path)
    try:
        with zipfile.ZipFile(path) as archive:
            _validate_zip_members(archive)
            names = set(archive.namelist())
            if not set(IPA_PLISTS).issubset(names):
                raise StoreError("IPA 缺少主 App、Widget 或 Watch 的 Info.plist。")
            for plist_name, expected_bundle_id in IPA_PLISTS.items():
                try:
                    value = plistlib.loads(archive.read(plist_name))
                except (KeyError, ValueError, plistlib.InvalidFileException) as exc:
                    raise StoreError("IPA 的 Info.plist 无效。") from exc
                if not isinstance(value, dict):
                    raise StoreError("IPA 的 Info.plist 顶层必须是对象。")
                if value.get("CFBundleIdentifier") != expected_bundle_id:
                    raise StoreError("IPA 的 Bundle ID 不属于 Boji。")
                if value.get("CFBundleShortVersionString") != version:
                    raise StoreError("IPA 的版本号与请求版本不一致。")
                if value.get("CFBundleVersion") != build_number:
                    raise StoreError("IPA 的构建号与请求构建号不一致。")
    except zipfile.BadZipFile as exc:
        raise StoreError("IPA 不是有效 ZIP 归档。") from exc
    except OSError as exc:
        raise StoreError("无法安全读取 IPA。") from exc
    return _sha256(path)


def validate_upload_inputs(ipa: Path, version: str, build_number: str, commit: str) -> str:
    _require_text(version, VERSION_RE, "version")
    _require_text(build_number, BUILD_RE, "buildNumber")
    _require_text(commit, COMMIT_RE, "commit")
    return inspect_ipa(ipa, version, build_number)


def _runtime_env() -> dict[str, str]:
    required = ("ASC_KEY_ID", "ASC_ISSUER_ID", "ASC_PRIVATE_KEY_P8")
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        raise StoreError(f"缺少 CI 注入的凭据变量：{', '.join(missing)}。")
    # Do not pass profiles, legacy keys, or Keychain fallback into asc.
    environment = {key: value for key, value in os.environ.items() if not key.startswith(("ASC_", "IOS_"))}
    for name in required:
        environment[name] = os.environ[name]
    environment["ASC_BYPASS_KEYCHAIN"] = "1"
    if os.environ.get("ASC_CONFIG_PATH"):
        environment["ASC_CONFIG_PATH"] = os.environ["ASC_CONFIG_PATH"]
    return environment


def run_asc(arguments: list[str]) -> str:
    """Run asc privately.  Callers must never print the returned string."""
    try:
        binary = verified_binary()
    except (OSError, ValueError) as exc:
        raise StoreError("固定 asc 二进制验证失败。") from exc
    try:
        result = subprocess.run(
            [str(binary), *arguments],
            cwd=ROOT,
            env=_runtime_env(),
            text=True,
            capture_output=True,
            check=False,
        )
    except OSError as exc:
        raise AscCommandError("asc 无法启动。") from exc
    if result.returncode != 0:
        raise AscCommandError("asc 操作失败。")
    return result.stdout


def _asc_json(arguments: list[str]) -> dict[str, Any]:
    raw = run_asc(arguments)
    try:
        response = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise StoreError("asc 未返回预期 JSON。") from exc
    if not isinstance(response, dict):
        raise StoreError("asc JSON 顶层不是对象。")
    return response


def _resource_list(response: dict[str, Any], label: str) -> list[dict[str, Any]]:
    data = response.get("data")
    if not isinstance(data, list) or not all(isinstance(item, dict) for item in data):
        raise StoreError(f"Apple 未返回有效的{label}列表。")
    return data


def _resource_object(response: dict[str, Any], label: str) -> dict[str, Any]:
    data = response.get("data")
    if not isinstance(data, dict):
        raise StoreError(f"Apple 未返回有效的{label}对象。")
    return data


def _relationship_id(resource: dict[str, Any], relationship: str) -> str:
    relations = resource.get("relationships")
    if not isinstance(relations, dict):
        raise RemoteBuildError("Apple 构建关联不完整。")
    relation = relations.get(relationship)
    if not isinstance(relation, dict):
        raise RemoteBuildError("Apple 构建关联不完整。")
    data = relation.get("data")
    if not isinstance(data, dict) or not isinstance(data.get("id"), str):
        raise RemoteBuildError("Apple 构建关联不完整。")
    return data["id"]


def assert_remote_app() -> None:
    response = _asc_json(["apps", "view", "--id", APP_ID, "--fields", "bundleId", "--output", "json"])
    app = _resource_object(response, "应用")
    attributes = app.get("attributes")
    if app.get("id") != APP_ID or not isinstance(attributes, dict) or attributes.get("bundleId") != BUNDLE_ID:
        raise StoreError("Apple 返回的 App ID 或 Bundle ID 不匹配。")


def _build_query(version: str, build_number: str) -> list[str]:
    return [
        "builds", "list", "--app", APP_ID, "--platform", PLATFORM,
        "--version", version, "--build-number", build_number,
        "--processing-state", "all",
        "--include", "app,preReleaseVersion", "--paginate", "--output", "json",
    ]


def build_already_exists(version: str, build_number: str) -> bool:
    response = _asc_json(_build_query(version, build_number))
    return bool(_resource_list(response, "构建"))


def _included_resource(response: dict[str, Any], resource_id: str) -> dict[str, Any] | None:
    included = response.get("included", [])
    if not isinstance(included, list):
        return None
    matches = [item for item in included if isinstance(item, dict) and item.get("id") == resource_id]
    return matches[0] if len(matches) == 1 else None


def find_verified_build(version: str, build_number: str, expected_id: str | None = None) -> str:
    """Return one VALID, iOS, Boji build with the requested marketing version."""
    response = _asc_json(_build_query(version, build_number))
    builds = _resource_list(response, "构建")
    if expected_id is not None:
        builds = [item for item in builds if item.get("id") == expected_id]
    if len(builds) != 1:
        raise RemoteBuildError("无法唯一确认收据指定的构建。")
    build = builds[0]
    build_id = build.get("id")
    attributes = build.get("attributes")
    if not isinstance(build_id, str) or not ID_RE.fullmatch(build_id) or not isinstance(attributes, dict):
        raise RemoteBuildError("Apple 构建记录无效。")
    if attributes.get("version") != build_number or attributes.get("processingState") != "VALID":
        raise RemoteBuildError("Apple 构建不是有效处理状态。")
    if _relationship_id(build, "app") != APP_ID:
        raise RemoteBuildError("Apple 构建不属于 Boji。")
    pre_release_id = _relationship_id(build, "preReleaseVersion")
    pre_release = _included_resource(response, pre_release_id)
    if not isinstance(pre_release, dict) or not isinstance(pre_release.get("attributes"), dict):
        raise RemoteBuildError("Apple 预发布版本关联不完整。")
    pre_attributes = pre_release["attributes"]
    if pre_attributes.get("version") != version or pre_attributes.get("platform") != PLATFORM:
        raise RemoteBuildError("Apple 预发布版本不匹配。")
    return build_id


def _write_receipt(path: Path, receipt: dict[str, Any]) -> None:
    if path.exists() and path.is_symlink():
        raise StoreError("收据输出路径不能是符号链接。")
    parent = path.parent
    parent.mkdir(parents=True, exist_ok=True)
    if parent.is_symlink():
        raise StoreError("收据输出目录不能是符号链接。")
    descriptor, temporary_name = tempfile.mkstemp(prefix=".receipt-", suffix=".json", dir=parent)
    temporary = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            json.dump(receipt, stream, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            stream.write("\n")
        temporary.chmod(0o600)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def upload(ipa: Path, version: str, build_number: str, commit: str, receipt_path: Path, apply: bool) -> None:
    ipa_sha256 = validate_upload_inputs(ipa, version, build_number, commit)
    if not apply:
        print("离线上传计划已通过：不会读取凭据、连接 Apple 或写入收据。")
        return

    assert_remote_app()
    if build_already_exists(version, build_number):
        raise StoreError("该版本和构建号已存在；停止以避免重复上传。")
    if inspect_ipa(ipa, version, build_number) != ipa_sha256:
        raise StoreError("IPA 在校验后发生变化；停止上传。")
    try:
        run_asc([
            "builds", "upload", "--app", APP_ID, "--ipa", str(ipa),
            "--version", version, "--build-number", build_number,
            "--wait", "--output", "json",
        ])
        build_id = find_verified_build(version, build_number)
    except (AscCommandError, RemoteBuildError) as exc:
        raise StoreError(
            "上传或处理未能确认成功；脚本没有自动重传。请在 App Store Connect 人工回查该版本和构建号。"
        ) from exc

    receipt = {
        "schemaVersion": SCHEMA_VERSION,
        "appId": APP_ID,
        "bundleId": BUNDLE_ID,
        "version": version,
        "buildNumber": build_number,
        "buildId": build_id,
        "commit": commit.lower(),
        "ipaSha256": ipa_sha256,
    }
    try:
        _write_receipt(receipt_path, receipt)
    except StoreError as exc:
        raise StoreError(
            "上传已成功确认，但无法写入收据；请人工回查构建，切勿自动重传。"
        ) from exc
    print("上传成功且处理状态为 VALID；已写入白名单收据。")


def _validate_release_approval(receipt: dict[str, Any]) -> None:
    approval = _json_object(approval_path(), "发布审批文件")
    if set(approval) != {"schemaVersion", "version", "testedCommit", "testedBuildId", "checks"}:
        raise StoreError("发布审批文件字段不符合白名单。")
    if type(approval.get("schemaVersion")) is not int or approval["schemaVersion"] != SCHEMA_VERSION:
        raise StoreError("发布审批文件 schemaVersion 不受支持。")
    if approval.get("version") != receipt["version"]:
        raise StoreError("发布审批版本与收据不一致。")
    if approval.get("testedCommit") != receipt["commit"] or approval.get("testedBuildId") != receipt["buildId"]:
        raise StoreError("验收记录未绑定此提交及构建，不能沿用旧构建的批准。")
    checks = approval.get("checks")
    if not isinstance(checks, dict) or set(checks) != REQUIRED_APPROVAL_CHECKS:
        raise StoreError("发布审批检查项不完整。")
    failed = [name for name in sorted(REQUIRED_APPROVAL_CHECKS) if checks.get(name) is not True]
    if failed:
        raise StoreError(f"发布审批未通过：{', '.join(failed)}。")


def validate_submit_inputs(receipt_path: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    receipt = read_receipt(receipt_path)
    try:
        config = manage.project()
    except (OSError, ValueError) as exc:
        raise StoreError("本地 project.json 或 project.yml 校验失败。") from exc
    if config.get("appId") != APP_ID or config.get("bundleId") != BUNDLE_ID:
        raise StoreError("本地项目身份不匹配。")
    if config.get("version") != receipt["version"]:
        raise StoreError("本地 project.json 版本与收据不一致。")
    if config.get("nameApproved") is not True or config.get("claimsVerified") is not True:
        raise StoreError("名称或功能声明尚未获批准。")
    errors = manage.validate_files(metadata_dir(), config, release=True)
    if errors:
        # validate_files already avoids values that may contain sensitive data.
        raise StoreError("本地发布元数据未通过白名单校验。")
    _validate_release_approval(receipt)
    return config, receipt


class _NoRedirect(urlrequest.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[no-untyped-def]
        return None


def _safe_public_https(url: str) -> tuple[str, str]:
    if not manage.valid_url(url):
        raise StoreError("隐私或支持网址不是有效的公网 HTTPS 地址。")
    parsed = urlparse.urlsplit(url)
    if parsed.port not in (None, 443) or not parsed.hostname:
        raise StoreError("隐私或支持网址不是有效的公网 HTTPS 地址。")
    host = parsed.hostname
    try:
        addresses = socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)
        resolved = {entry[4][0] for entry in addresses}
        if not resolved or any(not ipaddress.ip_address(address).is_global for address in resolved):
            raise ValueError("not global")
    except (OSError, ValueError):
        raise StoreError("隐私或支持网址不能解析到公网地址。") from None
    return url, host


def check_public_https_url(url: str) -> None:
    """Make a small proxy-free public HTTPS check and validate every redirect."""
    current = url
    opener = urlrequest.build_opener(urlrequest.ProxyHandler({}), _NoRedirect(), urlrequest.HTTPSHandler())
    for _ in range(6):
        _safe_public_https(current)
        request = urlrequest.Request(
            current,
            headers={"User-Agent": "Boji-Store-CI/1", "Range": "bytes=0-1023"},
            method="GET",
        )
        try:
            with opener.open(request, timeout=10) as response:
                status = response.getcode()
                if 200 <= status < 300:
                    response.read(1)
                    return
                raise StoreError("隐私或支持网址不可用。")
        except urlerror.HTTPError as exc:
            if exc.code not in {301, 302, 303, 307, 308}:
                raise StoreError("隐私或支持网址不可用。") from None
            location = exc.headers.get("Location")
            if not location:
                raise StoreError("隐私或支持网址重定向无效。") from None
            current = urlparse.urljoin(current, location)
        except (OSError, ValueError):
            raise StoreError("隐私或支持网址不可用。") from None
    raise StoreError("隐私或支持网址重定向过多。")


def check_public_release_urls(config: dict[str, Any]) -> None:
    """Check both release URLs for every locale without logging either value."""
    urls: list[str] = []
    for locale in config["locales"]:
        app_info = _json_object(metadata_dir() / "app-info" / f"{locale}.json", "发布元数据")
        version_info = _json_object(
            metadata_dir() / "version" / config["version"] / f"{locale}.json", "发布元数据"
        )
        privacy = app_info.get("privacyPolicyUrl")
        support = version_info.get("supportUrl")
        if not isinstance(privacy, str) or not isinstance(support, str):
            raise StoreError("发布元数据缺少隐私或支持网址。")
        urls.extend((privacy, support))
    for url in urls:
        check_public_https_url(url)


def find_prepared_manual_version(receipt: dict[str, Any]) -> None:
    response = _asc_json(["versions", "list", "--app", APP_ID, "--platform", PLATFORM, "--paginate", "--output", "json"])
    versions = _resource_list(response, "商店版本")
    selected: list[dict[str, Any]] = []
    for version in versions:
        attributes = version.get("attributes")
        if isinstance(attributes, dict) and attributes.get("versionString") == receipt["version"]:
            selected.append(version)
    if len(selected) != 1:
        raise StoreError("无法唯一确认已准备的商店版本。")
    version_id = selected[0].get("id")
    if not isinstance(version_id, str) or not ID_RE.fullmatch(version_id):
        raise StoreError("Apple 商店版本记录无效。")
    view = _asc_json([
        "versions", "view", "--version-id", version_id, "--include-build", "--include-submission", "--output", "json"
    ])
    version = _resource_object(view, "商店版本")
    attributes = version.get("attributes")
    if version.get("id") != version_id or not isinstance(attributes, dict):
        raise StoreError("Apple 商店版本记录无效。")
    if (
        attributes.get("versionString") != receipt["version"]
        or attributes.get("platform") != PLATFORM
        or attributes.get("releaseType") != "MANUAL"
    ):
        raise StoreError("商店版本不是匹配的 iOS 手动发布版本。")
    relationships = version.get("relationships")
    build = relationships.get("build") if isinstance(relationships, dict) else None
    build_data = build.get("data") if isinstance(build, dict) else None
    if not isinstance(build_data, dict) or build_data.get("id") != receipt["buildId"]:
        raise StoreError("已准备的商店版本未附加收据中的同一构建。")


def submit(receipt_path: Path, apply: bool, check_remote: bool = False) -> None:
    config, receipt = validate_submit_inputs(receipt_path)
    if not apply and not check_remote:
        print("离线审核提交计划已通过：不会读取凭据、连接 Apple、改写元数据或发布。")
        return

    # This check is deliberately immediately before remote operations.  It checks
    # each redirect target and never writes a remote resource.
    check_public_release_urls(config)
    assert_remote_app()
    try:
        find_verified_build(receipt["version"], receipt["buildNumber"], receipt["buildId"])
        find_prepared_manual_version(receipt)
        run_asc([
            "validate", "--app", APP_ID, "--version", receipt["version"],
            "--platform", PLATFORM, "--strict", "--output", "json",
        ])
    except (AscCommandError, RemoteBuildError) as exc:
        raise StoreError("Apple 只读构建或提交校验失败；未提交审核。") from exc

    if not apply:
        print("远端只读检查通过；未修改商店或提交审核。")
        return

    try:
        # publish appstore and release stage can create versions or change metadata.
        # review submit is the narrow documented command for an existing version.
        run_asc([
            "review", "submit", "--app", APP_ID, "--version", receipt["version"],
            "--build-id", receipt["buildId"], "--platform", PLATFORM,
            "--confirm", "--output", "json",
        ])
    except AscCommandError as exc:
        raise StoreError("审核提交未获确认；脚本没有重试或发布版本。") from exc
    print("已提交收据指定的构建供审核；脚本没有发布版本。")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Boji 三层 App Store CI 操作。")
    actions = parser.add_subparsers(dest="action", required=True)
    upload_parser = actions.add_parser("upload", help="验证 IPA，并在 --apply 时仅上传到 TestFlight 构建池")
    upload_parser.add_argument("--ipa", required=True, type=Path)
    upload_parser.add_argument("--version", required=True)
    upload_parser.add_argument("--build-number", required=True)
    upload_parser.add_argument("--commit", required=True)
    upload_parser.add_argument("--receipt", required=True, type=Path)
    upload_parser.add_argument("--apply", action="store_true")
    submit_parser = actions.add_parser("submit", help="验证收据，并在 --apply 时提交已准备版本")
    submit_parser.add_argument("--receipt", required=True, type=Path)
    submit_parser.add_argument("--apply", action="store_true")
    submit_parser.add_argument("--check-remote", action="store_true", help="只读检查 Apple 构建、版本和正式网址")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        if args.action == "upload":
            upload(args.ipa, args.version, args.build_number, args.commit, args.receipt, args.apply)
        elif args.action == "submit":
            submit(args.receipt, args.apply, args.check_remote)
        else:  # pragma: no cover - argparse makes this unreachable.
            raise StoreError("未知操作。")
    except StoreError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
