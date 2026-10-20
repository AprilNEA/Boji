"""Boji metadata tooling. No command in this entry point writes to Apple."""
from __future__ import annotations

import argparse
import ipaddress
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
from urllib.parse import urlsplit

from install_asc import HERE, ROOT, install, verified_binary

WORK = ROOT / ".work" / "boji-asc"
APP_FIELDS = {"name", "subtitle", "privacyPolicyUrl", "privacyChoicesUrl", "privacyPolicyText"}
VERSION_FIELDS = {"description", "keywords", "marketingUrl", "promotionalText", "supportUrl", "whatsNew"}
LIMITS = {"name": 30, "subtitle": 30, "description": 4000, "keywords": 100,
          "promotionalText": 170, "whatsNew": 4000}


def read_json(path: Path) -> dict:
    if path.is_symlink():
        raise ValueError(f"禁止符号链接：{path.name}")

    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"JSON 存在重复字段：{path.name}")
            result[key] = value
        return result

    data = json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=unique)
    if not isinstance(data, dict):
        raise ValueError(f"JSON 顶层必须是对象：{path.name}")
    return data


def project() -> dict:
    config = read_json(HERE / "project.json")
    fields = {"bundleId", "appId", "version", "platform", "locales", "nameApproved", "claimsVerified"}
    if set(config) != fields:
        raise ValueError("project.json 必须使用规定的公开配置字段。")
    if config.get("platform") != "IOS":
        raise ValueError("本入口仅管理 IOS 元数据。")
    if config.get("bundleId") != "club.leanmuscle.boji":
        raise ValueError("Bundle ID 与 Boji 不一致。")
    if not isinstance(config.get("version"), str) or not re.fullmatch(r"\d+\.\d+(?:\.\d+)?", config["version"]):
        raise ValueError("version 必须是显式的数字版本。")
    locales = config.get("locales")
    if not isinstance(locales, list) or not locales or not all(isinstance(item, str) for item in locales):
        raise ValueError("locales 必须是非空文本列表。")
    if len(set(locales)) != len(locales):
        raise ValueError("locales 必须是非空且不重复的语言列表。")
    if any(not isinstance(locale, str) or not re.fullmatch(r"[a-z]{2}(?:-[A-Za-z]{2,4})?", locale) for locale in locales):
        raise ValueError("语言标识不合法。")
    spec = (ROOT / "ios" / "project.yml").read_text(encoding="utf-8")
    version = re.search(r"MARKETING_VERSION:\s*['\"]?([\d.]+)", spec)
    if not version or version.group(1) != config["version"]:
        raise ValueError("project.json 版本必须与 ios/project.yml 一致。")
    return config


def valid_url(value: str) -> bool:
    try:
        url = urlsplit(value)
        host = url.hostname
        if url.scheme != "https" or not host or url.username or url.password:
            return False
        if host == "localhost" or host.endswith((".localhost", ".local", ".invalid", ".example")):
            return False
        if host in {"example.com", "example.org", "example.net"}:
            return False
        try:
            return ipaddress.ip_address(host).is_global
        except ValueError:
            return "." in host
    except ValueError:
        return False


def validate_files(directory: Path, config: dict, release: bool = False) -> list[str]:
    errors = []
    if directory.is_symlink() or not directory.is_dir():
        return ["metadata 必须是普通目录。"]
    expected = {f"app-info/{locale}.json" for locale in config["locales"]}
    # asc 5.16.0 generates 'version', despite the plural used in parts of its docs.
    expected |= {f"version/{config['version']}/{locale}.json" for locale in config["locales"]}
    seen = set()
    documents = {}
    for file in sorted(directory.rglob("*")):
        relative = file.relative_to(directory).as_posix()
        if file.is_symlink():
            errors.append(f"禁止符号链接：{relative}")
            continue
        if file.is_dir():
            continue
        parts = file.relative_to(directory).parts
        app_file = len(parts) == 2 and parts[0] == "app-info"
        version_file = len(parts) == 3 and parts[0] == "version" and re.fullmatch(r"\d+\.\d+(?:\.\d+)?", parts[1])
        if not (app_file or version_file) or file.suffix != ".json" or file.stem not in config["locales"]:
            errors.append(f"非白名单文件：{relative}")
            continue
        seen.add(relative)
        try:
            data = read_json(file)
        except (ValueError, OSError):
            errors.append(f"JSON 无效或有重复字段：{relative}")
            continue
        documents[relative] = data
        allowed = APP_FIELDS if app_file else VERSION_FIELDS
        if not data:
            errors.append(f"禁止空对象：{relative}")
        for key, value in data.items():
            label = f"{relative}:{key}"
            if key not in allowed:
                errors.append(f"禁止非公开或未知字段：{label}")
                continue
            if not isinstance(value, str) or not value.strip():
                errors.append(f"禁止 null、空字符串或非文本：{label}")
                continue
            if key in LIMITS and len(value) > LIMITS[key]:
                errors.append(f"超过字段字符上限：{label}")
            if key == "keywords" and len(value.encode("utf-8")) > 100:
                errors.append(f"关键词超过 100 个 UTF-8 字节：{label}")
            if key.endswith("Url") and not valid_url(value):
                errors.append(f"必须使用非占位的公网 HTTPS 地址：{label}")
            if re.search(r"-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+\S+|\{\{secret:", value):
                errors.append(f"检测到疑似凭据：{label}")
    errors.extend(f"缺少语言文件：{path}" for path in sorted(expected - seen))
    if release:
        if not isinstance(config.get("appId"), str) or not re.fullmatch(r"[0-9]+", config["appId"]):
            errors.append("尚未设置 App Store 数字 appId。")
        for flag in ("nameApproved", "claimsVerified"):
            if config.get(flag) is not True:
                errors.append(f"发布确认尚未完成：{flag}")
        for locale in config["locales"]:
            for path, required in ((f"app-info/{locale}.json", ("name", "privacyPolicyUrl")),
                                   (f"version/{config['version']}/{locale}.json", ("description", "supportUrl"))):
                for field in required:
                    if not documents.get(path, {}).get(field):
                        errors.append(f"发布必填项缺失：{path}:{field}")
    return errors


def command(args: list[str], offline: bool = False, capture: bool = False) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    if offline:
        env = {key: value for key, value in env.items() if not key.startswith("ASC_")}
        env["ASC_CONFIG_PATH"] = str(WORK / "offline-no-credentials.json")
        env["ASC_BYPASS_KEYCHAIN"] = "1"
    return subprocess.run([str(verified_binary()), *args], cwd=ROOT, env=env,
                          text=True, capture_output=capture, check=True)


def validate(config: dict, release: bool) -> None:
    errors = validate_files(HERE / "metadata", config, release)
    if errors:
        raise ValueError("\n".join(errors))
    command(["metadata", "validate", "--dir", str(HERE / "metadata"), "--output", "json"], offline=True)
    if not release:
        print("草案校验通过；这不代表已满足发布条件。")


def remote_target(config: dict) -> list[str]:
    app_id = config.get("appId")
    if not isinstance(app_id, str) or not re.fullmatch(r"[0-9]+", app_id):
        raise ValueError("先在 project.json 设置真实 App Store 数字 appId；不会自动创建应用。")
    result = command(["apps", "view", "--id", app_id, "--fields", "bundleId", "--output", "json"], capture=True)
    data = json.loads(result.stdout).get("data", {})
    if not isinstance(data, dict) or data.get("id") != app_id or data.get("attributes", {}).get("bundleId") != config["bundleId"]:
        raise ValueError("Apple 返回的应用身份不匹配；未继续操作。")
    return ["--app", app_id, "--version", config["version"], "--platform", "IOS"]


def preview_args(config: dict, target: list[str]) -> list[str]:
    return ["metadata", "push", *target, "--dir", str(HERE / "metadata"), "--dry-run", "--output", "json"]


def main() -> int:
    parser = argparse.ArgumentParser(description="Boji 商店元数据；只校验、拉取或预览，不向 Apple 写入。")
    sub = parser.add_subparsers(dest="action", required=True)
    sub.add_parser("install", help="联网安装固定版本，不改全局 PATH")
    sub.add_parser("version", help="校验摘要并显示实际版本")
    sub.add_parser("check-connection", help="只读验证 Apple 凭据和目标 App ID，不处理版本文案")
    validation = sub.add_parser("validate", help="完全离线的公开字段校验")
    validation.add_argument("--release", action="store_true", help="额外检查发布必填项，不连接 Apple")
    sub.add_parser("preview", help="联网核对应用身份并预览差异；不上传")
    sub.add_parser("pull", help="下载到忽略目录；不覆盖公开源文件")
    args = parser.parse_args()
    try:
        if args.action == "install":
            print(install())
            command(["version"], offline=True)
        elif args.action == "version":
            command(["version"], offline=True)
        else:
            config = project()
            if args.action == "validate":
                validate(config, args.release)
            elif args.action == "check-connection":
                remote_target(config)
                print(f"Apple API 鉴权和目标身份校验通过：{config['appId']}")
            else:
                if args.action == "preview":
                    validate(config, False)
                target = remote_target(config)
                WORK.mkdir(parents=True, exist_ok=True)
                if args.action == "preview":
                    result = command(preview_args(config, target), capture=True)
                    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", suffix=".json", prefix="preview-", dir=WORK, delete=False) as stream:
                        stream.write(result.stdout)
                        print(f"只读预览已保存：{stream.name}")
                else:
                    destination = Path(tempfile.mkdtemp(prefix="pull-", dir=WORK))
                    command(["metadata", "pull", *target, "--dir", str(destination)], capture=True)
                    print(f"已拉取到忽略目录：{destination}")
    except (OSError, ValueError) as error:
        print(str(error), file=sys.stderr)
        return 1
    except subprocess.CalledProcessError as error:
        # Do not echo captured Apple responses, tokens, or contact details.
        print(f"asc 执行失败，退出码 {error.returncode}；请检查目标、网络和凭据。", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
