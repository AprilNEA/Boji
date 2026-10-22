from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
import io
import json
import os
from pathlib import Path
import plistlib
import stat
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import store


VERSION = "1.2.3"
BUILD = "42"
COMMIT = "a" * 40
SHA = "b" * 64
BUILD_ID = "47e343aa-8540-4b1c-b1c6-f375b7f64873"
FAKE_P8 = "-----BEGIN PRIVATE KEY-----\nfake-ci-key\n-----END PRIVATE KEY-----\n"


def receipt_data(**changes):
    receipt = {
        "schemaVersion": 1,
        "appId": store.APP_ID,
        "bundleId": store.BUNDLE_ID,
        "version": VERSION,
        "buildNumber": BUILD,
        "buildId": BUILD_ID,
        "commit": COMMIT,
        "ipaSha256": SHA,
    }
    receipt.update(changes)
    return receipt


def approval_data(version: str = VERSION, **changes):
    approval = {
        "schemaVersion": 1,
        "version": version,
        "testedCommit": COMMIT,
        "testedBuildId": BUILD_ID,
        "checks": {
            "backend": True,
            "reviewAccess": True,
            "privacy": True,
            "legal": True,
            "screenshots": True,
            "exportCompliance": True,
        },
    }
    approval.update(changes)
    return approval


def build_payload(state: str = "VALID", build_id: str = BUILD_ID):
    return {
        "data": [{
            "id": build_id,
            "attributes": {"version": BUILD, "processingState": state},
            "relationships": {
                "app": {"data": {"id": store.APP_ID}},
                "preReleaseVersion": {"data": {"id": "pre-1"}},
            },
        }],
        "included": [{
            "id": "pre-1",
            "attributes": {"version": VERSION, "platform": "IOS"},
        }],
    }


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.ipa = self.root / "Boji.ipa"
        self.receipt = self.root / "receipt.json"
        self.make_ipa(self.ipa)
        self.config = {
            "appId": store.APP_ID,
            "bundleId": store.BUNDLE_ID,
            "version": VERSION,
            "platform": "IOS",
            "locales": ["en-US"],
            "nameApproved": True,
            "claimsVerified": True,
        }

    def make_ipa(self, path: Path, mutate=None):
        plists = {
            plist_name: {
                "CFBundleIdentifier": bundle_id,
                "CFBundleShortVersionString": VERSION,
                "CFBundleVersion": BUILD,
            }
            for plist_name, bundle_id in store.IPA_PLISTS.items()
        }
        plists[store.MAIN_APP_PLIST].update({
            "CFBundleDisplayName": "Lean Muscle",
            "NSHealthShareUsageDescription": "Read permitted health data.",
            "NSHealthUpdateUsageDescription": "No health data is written.",
            "UISupportedInterfaceOrientations~ipad": sorted(store.REQUIRED_IPAD_ORIENTATIONS),
        })
        plists[store.WIDGET_PLIST]["CFBundleDisplayName"] = "Lean Muscle Widgets"
        plists[store.WATCH_PLIST].update({
            "CFBundleDisplayName": "Lean Muscle Watch",
            "CFBundleIconName": "WatchIcon",
            "CFBundleIconFiles": ["WatchIcon.png"],
            "CFBundleIcons": {
                "CFBundlePrimaryIcon": {
                    "CFBundleIconName": "WatchIcon",
                    "CFBundleIconFiles": ["WatchIcon.png"],
                },
            },
        })
        files = {f"{store.WATCH_BUNDLE_ROOT}/WatchIcon.png": b"watch-icon"}
        if mutate is not None:
            mutate(plists, files)
        with zipfile.ZipFile(path, "w") as archive:
            for plist_name, value in plists.items():
                archive.writestr(plist_name, plistlib.dumps(value))
            for file_name, value in files.items():
                archive.writestr(file_name, value)

    def prepared_private_directory(self) -> Path:
        directory = self.root / "private-evidence"
        logs = directory / "logs"
        gnupg = directory / "gnupg"
        logs.mkdir(parents=True, mode=0o700)
        gnupg.mkdir(mode=0o700)
        directory.chmod(0o700)
        logs.chmod(0o700)
        gnupg.chmod(0o700)
        recipient = directory / "recipient-fingerprint"
        recipient.write_text("A" * 40 + "\n", encoding="ascii")
        recipient.chmod(0o600)
        return directory

    def write_receipt(self, data=None):
        self.receipt.write_text(json.dumps(data or receipt_data()), encoding="utf-8")

    def write_approval(self, data=None):
        path = self.root / "ios/ci/release-approval.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data or approval_data()), encoding="utf-8")

    def submit_patches(self):
        return (
            patch.object(store, "ROOT", self.root),
            patch.object(store.manage, "project", return_value=self.config),
            patch.object(store.manage, "validate_files", return_value=[]),
        )

    def test_upload_plan_has_zero_remote_writes_or_receipt_write(self):
        with patch.object(store, "run_asc") as asc, patch.object(store, "verified_binary") as binary:
            result = store.main([
                "upload", "--ipa", str(self.ipa), "--version", VERSION,
                "--build-number", BUILD, "--commit", COMMIT,
                "--receipt", str(self.receipt),
            ])
        self.assertEqual(result, 0)
        asc.assert_not_called()
        binary.assert_not_called()
        self.assertFalse(self.receipt.exists())

    def test_submit_plan_has_zero_remote_writes_or_url_requests(self):
        self.write_receipt()
        self.write_approval()
        root, project, validate = self.submit_patches()
        with root, project, validate, patch.object(store, "run_asc") as asc, \
                patch.object(store, "check_public_release_urls") as urls:
            result = store.main(["submit", "--receipt", str(self.receipt)])
        self.assertEqual(result, 0)
        asc.assert_not_called()
        urls.assert_not_called()

    def test_receipt_rejects_non_object_and_unlisted_or_invalid_fields(self):
        self.receipt.write_text("[]", encoding="utf-8")
        with self.assertRaisesRegex(store.StoreError, "顶层"):
            store.read_receipt(self.receipt)
        self.write_receipt({**receipt_data(), "unexpected": True})
        with self.assertRaisesRegex(store.StoreError, "白名单"):
            store.read_receipt(self.receipt)
        self.write_receipt(receipt_data(commit="not-a-sha"))
        with self.assertRaisesRegex(store.StoreError, "commit"):
            store.read_receipt(self.receipt)

    def test_invalid_ipa_blocks_plan_before_any_asc_call(self):
        with zipfile.ZipFile(self.ipa, "w") as archive:
            for plist_name, bundle_id in store.IPA_PLISTS.items():
                data = b"not a plist" if plist_name.endswith("Boji.app/Info.plist") else plistlib.dumps({
                    "CFBundleIdentifier": bundle_id,
                    "CFBundleShortVersionString": VERSION,
                    "CFBundleVersion": BUILD,
                })
                archive.writestr(plist_name, data)
        with patch.object(store, "run_asc") as asc:
            with self.assertRaises(store.StoreError):
                store.upload(self.ipa, VERSION, BUILD, COMMIT, self.receipt, apply=False)
        asc.assert_not_called()
        self.assertFalse(self.receipt.exists())

    def test_ipa_rejects_missing_health_update_description(self):
        def mutate(plists, _files):
            plists[store.MAIN_APP_PLIST]["NSHealthUpdateUsageDescription"] = " "

        self.make_ipa(self.ipa, mutate)
        with self.assertRaisesRegex(store.StoreError, "NSHealthUpdateUsageDescription"):
            store.inspect_ipa(self.ipa, VERSION, BUILD)

    def test_ipa_rejects_watch_without_icon_name_even_with_assets_catalog(self):
        def mutate(plists, files):
            watch = plists[store.WATCH_PLIST]
            watch.pop("CFBundleIconName")
            watch["CFBundleIcons"]["CFBundlePrimaryIcon"].pop("CFBundleIconName")
            files.clear()
            files[f"{store.WATCH_BUNDLE_ROOT}/Assets.car"] = b"compiled-icons"

        self.make_ipa(self.ipa, mutate)
        with self.assertRaisesRegex(store.StoreError, "CFBundleIconName"):
            store.inspect_ipa(self.ipa, VERSION, BUILD)

    def test_ipa_rejects_watch_without_referenced_icon_resource(self):
        def mutate(_plists, files):
            files.clear()

        self.make_ipa(self.ipa, mutate)
        with self.assertRaisesRegex(store.StoreError, "已引用的图标资源"):
            store.inspect_ipa(self.ipa, VERSION, BUILD)

    def test_ipa_rejects_empty_final_bundle_display_name(self):
        for plist_name, bundle in (
            (store.MAIN_APP_PLIST, "主 App"),
            (store.WIDGET_PLIST, "Widget"),
            (store.WATCH_PLIST, "Watch"),
        ):
            def mutate(plists, _files, plist_name=plist_name):
                plists[plist_name]["CFBundleDisplayName"] = ""

            with self.subTest(bundle=bundle):
                self.make_ipa(self.ipa, mutate)
                with self.assertRaisesRegex(store.StoreError, bundle):
                    store.inspect_ipa(self.ipa, VERSION, BUILD)

    def test_ipa_rejects_missing_iPad_upside_down_orientation(self):
        def mutate(plists, _files):
            plists[store.MAIN_APP_PLIST]["UISupportedInterfaceOrientations~ipad"] = [
                orientation for orientation in store.REQUIRED_IPAD_ORIENTATIONS
                if orientation != "UIInterfaceOrientationPortraitUpsideDown"
            ]

        self.make_ipa(self.ipa, mutate)
        with self.assertRaisesRegex(store.StoreError, "iPad 四方向"):
            store.inspect_ipa(self.ipa, VERSION, BUILD)

    def test_ipa_accepts_xcode_27_nested_watch_icon_catalog(self):
        def mutate(plists, files):
            watch = plists[store.WATCH_PLIST]
            watch.pop("CFBundleIconName")
            watch.pop("CFBundleIconFiles")
            watch["CFBundleIcons"]["CFBundlePrimaryIcon"].pop("CFBundleIconFiles")
            files.clear()
            files[f"{store.WATCH_BUNDLE_ROOT}/Assets.car"] = b"compiled-icons"

        self.make_ipa(self.ipa, mutate)
        self.assertEqual(len(store.inspect_ipa(self.ipa, VERSION, BUILD)), 64)

    def test_ipa_rejects_icon_name_without_real_catalog_or_files(self):
        for catalog in (None, b""):
            def mutate(plists, files):
                watch = plists[store.WATCH_PLIST]
                watch.pop("CFBundleIconFiles")
                watch["CFBundleIcons"]["CFBundlePrimaryIcon"].pop("CFBundleIconFiles")
                files.clear()
                if catalog is not None:
                    files[f"{store.WATCH_BUNDLE_ROOT}/Assets.car"] = catalog

            with self.subTest(catalog=catalog):
                self.make_ipa(self.ipa, mutate)
                with self.assertRaisesRegex(store.StoreError, "图标资源"):
                    store.inspect_ipa(self.ipa, VERSION, BUILD)

    def test_upload_rejects_duplicate_before_any_upload(self):
        with patch.object(store, "assert_remote_app") as identity, \
                patch.object(store, "build_already_exists", return_value=True), \
                patch.object(store, "run_asc") as asc:
            with self.assertRaisesRegex(store.StoreError, "已存在"):
                store.upload(self.ipa, VERSION, BUILD, COMMIT, self.receipt, apply=True)
        identity.assert_called_once()
        asc.assert_not_called()
        self.assertFalse(self.receipt.exists())

    def test_processing_state_not_valid_stops_without_retry(self):
        with patch.object(store, "assert_remote_app"), \
                patch.object(store, "build_already_exists", return_value=False), \
                patch.object(store, "run_asc", side_effect=["{}", json.dumps(build_payload("UNRECOGNIZED"))]) as asc:
            with self.assertRaisesRegex(store.StoreError, "没有自动重传"):
                store.upload(self.ipa, VERSION, BUILD, COMMIT, self.receipt, apply=True)
        self.assertEqual(asc.call_count, 2)
        upload_calls = [call for call in asc.call_args_list if call.args[0][:2] == ["builds", "upload"]]
        self.assertEqual(len(upload_calls), 1)
        self.assertFalse(self.receipt.exists())

    def test_upload_failure_does_not_retry(self):
        with patch.object(store, "assert_remote_app"), \
                patch.object(store, "build_already_exists", return_value=False), \
                patch.object(store, "run_asc", side_effect=store.AscCommandError("private asc output")) as asc:
            with self.assertRaisesRegex(store.StoreError, "没有自动重传") as caught:
                store.upload(self.ipa, VERSION, BUILD, COMMIT, self.receipt, apply=True)
        self.assertNotIn("private asc output", str(caught.exception))
        self.assertEqual(asc.call_count, 1)
        self.assertFalse(self.receipt.exists())

    def test_submit_rejects_false_approval_check(self):
        self.write_receipt()
        for check in approval_data()["checks"]:
            approval = approval_data()
            approval["checks"][check] = False
            self.write_approval(approval)
            root, project, validate = self.submit_patches()
            with self.subTest(check=check), root, project, validate, self.assertRaisesRegex(store.StoreError, "发布审批未通过"):
                store.validate_submit_inputs(self.receipt)

    def test_submit_rejects_local_version_mismatch(self):
        self.write_receipt(receipt_data(version="9.9.9"))
        self.write_approval(approval_data(version="9.9.9"))
        root, project, validate = self.submit_patches()
        with root, project, validate:
            with self.assertRaisesRegex(store.StoreError, "版本与收据不一致"):
                store.validate_submit_inputs(self.receipt)

    def test_old_build_approval_cannot_authorize_a_new_build(self):
        self.write_receipt()
        for field, value in (("testedCommit", "c" * 40), ("testedBuildId", "other-build")):
            self.write_approval(approval_data(**{field: value}))
            root, project, validate = self.submit_patches()
            with self.subTest(field=field), root, project, validate, self.assertRaisesRegex(store.StoreError, "验收记录"):
                store.validate_submit_inputs(self.receipt)

    def test_asc_environment_excludes_signing_material_and_legacy_keys(self):
        environment = {
            "ASC_KEY_ID": "test-id", "ASC_ISSUER_ID": "test-issuer", "ASC_PRIVATE_KEY_P8": FAKE_P8,
            "ASC_PRIVATE_KEY": "legacy-key", "ASC_BYPASS_KEYCHAIN": "0",
            "ASC_CONFIG_PATH": "/test/no-config.json", "IOS_APP_PROFILE_BASE64": "test-profile",
            "IOS_DISTRIBUTION_P12_PASSWORD": "test-password", "OP_SERVICE_ACCOUNT_TOKEN": "test-token",
            "OP_OTHER_SECRET": "other-token", "PATH": "/usr/bin",
        }
        private_key_path = self.root / "AuthKey.p8"
        with patch.dict(os.environ, environment, clear=True):
            result = store._runtime_env(private_key_path)
        self.assertEqual(result["ASC_PRIVATE_KEY_PATH"], str(private_key_path))
        self.assertEqual(result["ASC_BYPASS_KEYCHAIN"], "1")
        self.assertEqual(result["ASC_CONFIG_PATH"], "/test/no-config.json")
        self.assertNotIn("ASC_PRIVATE_KEY", result)
        self.assertNotIn("ASC_PRIVATE_KEY_P8", result)
        self.assertFalse(any(key.startswith("IOS_") for key in result))
        self.assertFalse(any(key.startswith("OP_") for key in result))

    def test_run_asc_uses_private_key_file_and_removes_it_after_return(self):
        environment = {
            "ASC_KEY_ID": "test-id",
            "ASC_ISSUER_ID": "test-issuer",
            "ASC_PRIVATE_KEY_P8": FAKE_P8,
            "ASC_CONFIG_PATH": "/test/no-config.json",
            "ASC_PRIVATE_KEY": "legacy-key",
            "IOS_APP_PROFILE_BASE64": "test-profile",
            "OP_SERVICE_ACCOUNT_TOKEN": "test-token",
            "OP_OTHER_SECRET": "other-token",
            "PATH": "/usr/bin",
        }
        captured: dict[str, Path] = {}

        def run(command, **kwargs):
            asc_environment = kwargs["env"]
            private_key_path = Path(asc_environment["ASC_PRIVATE_KEY_PATH"])
            captured["path"] = private_key_path
            captured["directory"] = private_key_path.parent
            self.assertEqual(command, ["/test/asc", "apps", "view"])
            self.assertEqual(private_key_path.read_text(encoding="utf-8"), FAKE_P8)
            self.assertEqual(stat.S_IMODE(private_key_path.stat().st_mode), 0o600)
            self.assertEqual(stat.S_IMODE(private_key_path.parent.stat().st_mode), 0o700)
            self.assertEqual(asc_environment["ASC_KEY_ID"], "test-id")
            self.assertEqual(asc_environment["ASC_ISSUER_ID"], "test-issuer")
            self.assertEqual(asc_environment["ASC_BYPASS_KEYCHAIN"], "1")
            self.assertEqual(asc_environment["ASC_CONFIG_PATH"], "/test/no-config.json")
            self.assertNotIn("ASC_PRIVATE_KEY_P8", asc_environment)
            self.assertNotIn("ASC_PRIVATE_KEY", asc_environment)
            self.assertFalse(any(key.startswith(("OP_", "IOS_")) for key in asc_environment))
            self.assertNotIn(FAKE_P8, asc_environment.values())
            return subprocess.CompletedProcess(command, 0, stdout="{}", stderr="private response")

        with patch.dict(os.environ, environment, clear=True), \
                patch.object(store, "verified_binary", return_value=Path("/test/asc")), \
                patch.object(store.subprocess, "run", side_effect=run):
            self.assertEqual(store.run_asc(["apps", "view"]), "{}")
        self.assertFalse(captured["path"].exists())
        self.assertFalse(captured["directory"].exists())

    def test_run_asc_removes_private_key_after_failure_and_exception(self):
        environment = {
            "ASC_KEY_ID": "test-id",
            "ASC_ISSUER_ID": "test-issuer",
            "ASC_PRIVATE_KEY_P8": FAKE_P8,
        }

        for side_effect in (
            lambda command, **kwargs: subprocess.CompletedProcess(command, 1, stdout="", stderr="private response"),
            lambda command, **kwargs: (_ for _ in ()).throw(OSError("private response")),
        ):
            stdout = io.StringIO()
            stderr = io.StringIO()
            with self.subTest(side_effect=side_effect), patch.dict(os.environ, environment, clear=True), \
                    patch.object(store, "verified_binary", return_value=Path("/test/asc")), \
                    patch.object(store.subprocess, "run", side_effect=side_effect) as run:
                with redirect_stdout(stdout), redirect_stderr(stderr), self.assertRaises(store.AscCommandError) as caught:
                    store.run_asc(["apps", "view"])
            private_key_path = Path(run.call_args.kwargs["env"]["ASC_PRIVATE_KEY_PATH"])
            self.assertNotIn(FAKE_P8, str(caught.exception))
            self.assertNotIn("private response", str(caught.exception))
            self.assertNotIn("private response", stdout.getvalue())
            self.assertNotIn("private response", stderr.getvalue())
            self.assertFalse(private_key_path.exists())
            self.assertFalse(private_key_path.parent.exists())

    def test_run_asc_stores_failure_output_only_in_prepared_private_evidence(self):
        private_directory = self.prepared_private_directory()
        secret = "asc private error: token=not-for-console"
        environment = {
            "ASC_KEY_ID": "test-id",
            "ASC_ISSUER_ID": "test-issuer",
            "ASC_PRIVATE_KEY_P8": FAKE_P8,
            "PRIVATE_DIR": str(private_directory),
        }
        stdout = io.StringIO()
        stderr = io.StringIO()
        with patch.dict(os.environ, environment, clear=True), \
                patch.object(store, "verified_binary", return_value=Path("/test/asc")), \
                patch.object(
                    store.subprocess,
                    "run",
                    return_value=subprocess.CompletedProcess(["/test/asc"], 17, stdout=secret, stderr=secret),
                ):
            with redirect_stdout(stdout), redirect_stderr(stderr), self.assertRaises(store.AscCommandError) as caught:
                store.run_asc(["builds", "upload"])
        self.assertIn("退出码 17", str(caught.exception))
        self.assertNotIn(secret, str(caught.exception))
        self.assertNotIn(secret, stdout.getvalue())
        self.assertNotIn(secret, stderr.getvalue())
        logs = sorted((private_directory / "logs").glob("asc-*.log"))
        self.assertEqual(len(logs), 2)
        for log in logs:
            self.assertEqual(stat.S_IMODE(log.stat().st_mode), 0o600)
            self.assertEqual(log.read_text(encoding="utf-8"), secret)

    def test_run_asc_does_not_write_unprepared_private_directory(self):
        private_directory = self.root / "unprepared"
        private_directory.mkdir(mode=0o700)
        (private_directory / "logs").symlink_to(self.root, target_is_directory=True)
        environment = {
            "ASC_KEY_ID": "test-id",
            "ASC_ISSUER_ID": "test-issuer",
            "ASC_PRIVATE_KEY_P8": FAKE_P8,
            "PRIVATE_DIR": str(private_directory),
        }
        with patch.dict(os.environ, environment, clear=True), \
                patch.object(store, "verified_binary", return_value=Path("/test/asc")), \
                patch.object(
                    store.subprocess,
                    "run",
                    return_value=subprocess.CompletedProcess(["/test/asc"], 1, stdout="private", stderr="private"),
                ):
            with self.assertRaises(store.AscCommandError):
                store.run_asc(["apps", "view"])
        self.assertFalse(list(self.root.glob("asc-*.log")))

    def test_remote_check_has_no_write_commands(self):
        self.write_receipt()
        self.write_approval()
        root, project, validate = self.submit_patches()
        with root, project, validate, patch.object(store, "check_public_release_urls") as urls, \
                patch.object(store, "assert_remote_app"), patch.object(store, "find_verified_build"), \
                patch.object(store, "find_prepared_manual_version"), \
                patch.object(store, "run_asc", return_value="{}") as asc:
            store.submit(self.receipt, apply=False, check_remote=True)
        urls.assert_called_once()
        self.assertEqual(len(asc.call_args_list), 1)
        self.assertEqual(asc.call_args.args[0][0], "validate")

    def test_uuid_version_and_build_ids_are_accepted(self):
        self.write_receipt()
        self.assertEqual(store.read_receipt(self.receipt)["buildId"], BUILD_ID)
        version_id = "872f1e41-3575-4f30-9b52-851bdd1ccf09"
        attrs = {"versionString": VERSION, "platform": "IOS", "releaseType": "MANUAL"}
        resource = {"id": version_id, "attributes": attrs, "relationships": {"build": {"data": {"id": BUILD_ID}}}}
        with patch.object(store, "run_asc", side_effect=[json.dumps({"data": [resource]}), json.dumps({"data": resource})]):
            store.find_prepared_manual_version(receipt_data())
        with patch.object(store, "run_asc", return_value=json.dumps(build_payload())):
            self.assertEqual(store.find_verified_build(VERSION, BUILD), BUILD_ID)

    def test_build_lookup_rejects_a_different_build_id(self):
        with patch.object(store, "run_asc", return_value=json.dumps(build_payload(build_id="111"))):
            with self.assertRaisesRegex(store.RemoteBuildError, "无法唯一"):
                store.find_verified_build(VERSION, BUILD, BUILD_ID)

    def test_submit_passes_only_receipt_build_and_never_releases(self):
        self.write_receipt()
        self.write_approval()
        root, project, validate = self.submit_patches()
        with root, project, validate, \
                patch.object(store, "check_public_release_urls"), \
                patch.object(store, "assert_remote_app"), \
                patch.object(store, "find_verified_build") as build, \
                patch.object(store, "find_prepared_manual_version") as version, \
                patch.object(store, "run_asc", side_effect=["{}", "{}"] ) as asc:
            store.submit(self.receipt, apply=True)
        build.assert_called_once_with(VERSION, BUILD, BUILD_ID)
        version.assert_called_once()
        final = asc.call_args_list[-1].args[0]
        self.assertEqual(final[:2], ["review", "submit"])
        self.assertIn(BUILD_ID, final)
        self.assertNotIn("--wait", final)
        for call in asc.call_args_list:
            command = call.args[0]
            self.assertNotIn("release", command)
            self.assertNotIn("publish", command)
            self.assertNotEqual(command[:2], ["builds", "upload"])

    def test_privacy_url_never_enters_console_output(self):
        sensitive_url = "https://private.example.invalid/policy-token"
        receipt = receipt_data()
        stderr = io.StringIO()
        stdout = io.StringIO()
        with patch.object(store, "validate_submit_inputs", return_value=(self.config, receipt)), \
                patch.object(store, "check_public_release_urls", side_effect=store.StoreError("隐私或支持网址不可用")):
            with redirect_stdout(stdout), redirect_stderr(stderr):
                result = store.main(["submit", "--receipt", str(self.receipt), "--apply"])
        self.assertEqual(result, 1)
        self.assertNotIn(sensitive_url, stdout.getvalue())
        self.assertNotIn(sensitive_url, stderr.getvalue())


if __name__ == "__main__":
    unittest.main()
