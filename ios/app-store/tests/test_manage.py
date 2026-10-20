import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import install_asc
import manage


class MetadataTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.meta = self.root / "metadata"
        self.config = {"appId": None, "version": "0.7.0", "platform": "IOS",
                       "bundleId": "club.leanmuscle.boji", "locales": ["en-US"],
                       "nameApproved": False, "claimsVerified": False}
        self.app = self.meta / "app-info/en-US.json"
        self.version = self.meta / "version/0.7.0/en-US.json"
        self.save(self.app, {"name": "Lean Muscle Club"})
        self.save(self.version, {"description": "Local fitness tracking", "keywords": "fitness"})

    def save(self, path, data):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data), encoding="utf-8")

    def errors(self, release=False):
        return manage.validate_files(self.meta, self.config, release)

    def test_draft_without_placeholder_urls_is_valid(self):
        self.assertEqual(self.errors(), [])

    def test_review_credentials_and_unknown_fields_are_rejected(self):
        self.save(self.app, {"name": "Club", "demoPassword": "not-a-real-secret"})
        result = "\n".join(self.errors())
        self.assertIn("demoPassword", result)
        self.assertNotIn("not-a-real-secret", result)

    def test_null_and_empty_strings_are_rejected(self):
        for value in (None, "", "  ", 123):
            with self.subTest(value=value):
                self.save(self.app, {"name": value})
                self.assertTrue(self.errors())

    def test_duplicate_keys_are_rejected(self):
        self.app.write_text('{"name":"A","name":"B"}')
        self.assertTrue(self.errors())

    def test_keyword_utf8_byte_limit(self):
        self.save(self.version, {"keywords": "肌" * 34})
        self.assertTrue(any("UTF-8" in issue for issue in self.errors()))

    def test_name_length_limit(self):
        self.save(self.app, {"name": "A" * 31})
        self.assertTrue(self.errors())

    def test_default_locale_fanout_is_rejected(self):
        self.save(self.meta / "app-info/default.json", {"name": "Unexpected"})
        self.assertTrue(self.errors())

    def test_plural_version_directory_is_rejected(self):
        self.save(self.meta / "versions/0.7.0/en-US.json", {"description": "Wrong path"})
        self.assertTrue(self.errors())

    def test_symlink_is_rejected(self):
        self.app.unlink()
        self.app.symlink_to(self.version)
        self.assertTrue(self.errors())

    def test_missing_locale_is_rejected(self):
        self.app.unlink()
        self.assertTrue(self.errors())

    def test_private_key_content_is_rejected_without_echo(self):
        self.save(self.version, {"description": "-----BEGIN PRIVATE KEY-----\nsensitive"})
        result = "\n".join(self.errors())
        self.assertIn("凭据", result)
        self.assertNotIn("sensitive", result)

    def test_urls_must_be_public_https_without_credentials(self):
        invalid = ["http://boji.example.org/privacy", "https://example.com/privacy",
                   "https://localhost/privacy", "https://127.0.0.1/privacy",
                   "https://user:password@boji.example.org/privacy"]
        for value in invalid:
            with self.subTest(value=value):
                self.assertFalse(manage.valid_url(value))
        self.assertTrue(manage.valid_url("https://thinmuscle.club/app/privacy/"))

    def test_release_blocks_current_draft(self):
        result = "\n".join(self.errors(True))
        for field in ("appId", "nameApproved", "claimsVerified", "privacyPolicyUrl", "supportUrl"):
            self.assertIn(field, result)

    def test_release_required_fields_can_be_completed(self):
        self.config.update(appId="1234567890", nameApproved=True, claimsVerified=True)
        self.save(self.app, {"name": "Club", "privacyPolicyUrl": "https://thinmuscle.club/app/privacy/"})
        self.save(self.version, {"description": "Local fitness", "supportUrl": "https://thinmuscle.club/app/support/"})
        self.assertEqual(self.errors(True), [])

    def test_preview_always_uses_dry_run(self):
        args = manage.preview_args(self.config, ["--app", "1234567890", "--version", "0.7.0", "--platform", "IOS"])
        self.assertIn("--dry-run", args)
        for forbidden in ("--allow-deletes", "--confirm", "--force"):
            self.assertNotIn(forbidden, args)

    def test_no_app_id_means_no_apple_request(self):
        with patch.object(manage, "command") as run:
            with self.assertRaises(ValueError):
                manage.remote_target(self.config)
            run.assert_not_called()

    def test_remote_app_identity_mismatch_is_rejected(self):
        self.config["appId"] = "1234567890"
        response = {"data": {"id": "1234567890", "attributes": {"bundleId": "another.app"}}}
        with patch.object(manage, "command", return_value=subprocess.CompletedProcess([], 0, stdout=json.dumps(response))):
            with self.assertRaises(ValueError):
                manage.remote_target(self.config)

    def test_remote_identity_selects_exact_version_and_platform(self):
        self.config["appId"] = "1234567890"
        response = {"data": {"id": "1234567890", "attributes": {"bundleId": self.config["bundleId"]}}}
        with patch.object(manage, "command", return_value=subprocess.CompletedProcess([], 0, stdout=json.dumps(response))):
            args = manage.remote_target(self.config)
        self.assertEqual(args, ["--app", "1234567890", "--version", "0.7.0", "--platform", "IOS"])

    def test_connection_check_only_validates_app_identity(self):
        with patch.object(sys, "argv", ["manage.py", "check-connection"]), \
             patch.object(manage, "project", return_value=self.config), \
             patch.object(manage, "remote_target") as target, \
             patch.object(manage, "command") as command, \
             patch("builtins.print"):
            self.assertEqual(manage.main(), 0)
        target.assert_called_once_with(self.config)
        command.assert_not_called()

    def test_offline_command_does_not_use_asc_credentials(self):
        with patch.dict(os.environ, {"ASC_PRIVATE_KEY": "test-only", "ASC_PROFILE": "real-profile"}):
            with patch.object(manage, "verified_binary", return_value=Path("/test/asc")):
                with patch.object(manage.subprocess, "run") as run:
                    manage.command(["version"], offline=True)
        env = run.call_args.kwargs["env"]
        self.assertNotIn("ASC_PRIVATE_KEY", env)
        self.assertNotIn("ASC_PROFILE", env)
        self.assertEqual(env["ASC_BYPASS_KEYCHAIN"], "1")

    def test_project_version_must_match_xcodegen(self):
        self.save(self.root / "project.json", self.config)
        (self.root / "ios").mkdir()
        (self.root / "ios/project.yml").write_text("MARKETING_VERSION: '0.8.0'")
        with patch.object(manage, "HERE", self.root), patch.object(manage, "ROOT", self.root):
            with self.assertRaisesRegex(ValueError, "版本"):
                manage.project()


class InstallTests(unittest.TestCase):
    def test_download_checksum_failure_never_installs(self):
        with tempfile.TemporaryDirectory() as directory:
            binary = Path(directory) / "asc"
            asset = {"url": "https://example.com/asc", "sha256": "0" * 64}
            with patch.object(install_asc, "binary_path", return_value=binary), \
                 patch.object(install_asc, "asset_info", return_value=("test", "test", asset)), \
                 patch.object(install_asc.urllib.request, "urlopen", return_value=io.BytesIO(b"bad")):
                with self.assertRaises(ValueError):
                    install_asc.install()
            self.assertFalse(binary.exists())
            self.assertEqual(list(Path(directory).iterdir()), [])

    def test_valid_existing_binary_needs_no_network(self):
        with tempfile.TemporaryDirectory() as directory:
            binary = Path(directory) / "asc"
            binary.write_bytes(b"test-content")
            asset = {"sha256": hashlib.sha256(b"test-content").hexdigest()}
            with patch.object(install_asc, "binary_path", return_value=binary), \
                 patch.object(install_asc, "asset_info", return_value=("test", "test", asset)), \
                 patch.object(install_asc.urllib.request, "urlopen") as download:
                self.assertEqual(install_asc.install(), binary)
                download.assert_not_called()
                binary.write_bytes(b"tampered")
                with self.assertRaises(ValueError):
                    install_asc.verified_binary()


if __name__ == "__main__":
    unittest.main()
