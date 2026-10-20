from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
import unittest


ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "ios" / "ci" / "artifacts.py"


class ArtifactsCommandTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        # macOS Unix socket paths are limited; the repository path is too long.
        cls.temporary = tempfile.TemporaryDirectory(prefix="boji-gpg-", dir="/tmp")
        cls.addClassCleanup(cls._cleanup_temporary)
        cls.work = Path(cls.temporary.name)
        cls.keyring = cls.work / "test-keyring"
        cls.keyring.mkdir(mode=0o700)
        os.chmod(cls.keyring, 0o700)

        cls.gpg = "/opt/homebrew/bin/gpg"
        if not Path(cls.gpg).is_file():
            cls.gpg = subprocess.run(
                ["/usr/bin/which", "gpg"],
                check=False,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
            ).stdout.strip()
        if not cls.gpg:
            raise RuntimeError("GPG is unavailable for artifact tests.")

        generated = cls._gpg(
            "--pinentry-mode",
            "loopback",
            "--passphrase",
            "",
            "--quick-generate-key",
            "Artifact Test <artifact-test@invalid>",
            "rsa2048",
            "encr",
            "1d",
        )
        if generated.returncode != 0:
            detail = generated.stderr.decode("utf-8", "replace")
            raise RuntimeError(f"GPG could not generate the isolated test key: {detail}")

        listed = cls._gpg("--with-colons", "--list-keys")
        fingerprints = [line.split(":")[9] for line in listed.stdout.decode("ascii").splitlines() if line.startswith("fpr:")]
        if listed.returncode != 0 or not fingerprints:
            raise RuntimeError("GPG could not list the isolated test key.")
        cls.fingerprint = fingerprints[0]

        public = cls._gpg("--armor", "--export", cls.fingerprint)
        private = cls._gpg(
            "--pinentry-mode",
            "loopback",
            "--passphrase",
            "",
            "--armor",
            "--export-secret-keys",
            cls.fingerprint,
        )
        if public.returncode != 0 or private.returncode != 0:
            raise RuntimeError("GPG could not export the isolated test key.")
        cls.public_key = public.stdout.decode("ascii")
        cls.private_key = private.stdout.decode("ascii")

    @classmethod
    def _cleanup_temporary(cls) -> None:
        gpgconf = shutil.which("gpgconf")
        if gpgconf and hasattr(cls, "keyring"):
            subprocess.run([gpgconf, "--homedir", str(cls.keyring), "--kill", "gpg-agent"],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        cls.temporary.cleanup()

    @classmethod
    def _gpg(cls, *arguments: str) -> subprocess.CompletedProcess[bytes]:
        return subprocess.run(
            [
                cls.gpg,
                "--no-options",
                "--homedir",
                os.fspath(cls.keyring),
                "--batch",
                "--no-auto-key-retrieve",
                *arguments,
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
        )

    @classmethod
    def _environment(cls, **values: str) -> dict[str, str]:
        environment = {
            "PATH": os.environ.get("PATH", ""),
            "HOME": os.fspath(cls.work / "unused-home"),
            "LANG": "C",
            "LC_ALL": "C",
        }
        environment.update(values)
        return environment

    @classmethod
    def _command(
        cls,
        *arguments: str,
        input_data: bytes = b"",
        environment: dict[str, str] | None = None,
    ) -> subprocess.CompletedProcess[bytes]:
        return subprocess.run(
            [sys.executable, os.fspath(SCRIPT), *arguments],
            input=input_data,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=environment or cls._environment(),
            check=False,
        )

    def _prepared_workspace(self, name: str) -> Path:
        directory = self.work / name
        result = self._command(
            "prepare",
            "--directory",
            os.fspath(directory),
            environment=self._environment(IOS_ARTIFACT_PUBLIC_KEY=self.public_key),
        )
        self.assertEqual(result.returncode, 0, result.stderr.decode("utf-8", "replace"))
        return directory

    def test_prepare_hides_public_material_and_creates_private_workspace(self) -> None:
        directory = self.work / "prepared"
        result = self._command(
            "prepare",
            "--directory",
            os.fspath(directory),
            environment=self._environment(IOS_ARTIFACT_PUBLIC_KEY=self.public_key),
        )
        console = (result.stdout + result.stderr).decode("utf-8", "replace")

        self.assertEqual(result.returncode, 0, console)
        self.assertNotIn(self.public_key, console)
        self.assertNotIn(self.fingerprint, console)
        self.assertEqual(stat.S_IMODE(directory.stat().st_mode), 0o700)
        self.assertEqual(stat.S_IMODE((directory / "logs").stat().st_mode), 0o700)
        self.assertEqual(stat.S_IMODE((directory / "recipient-fingerprint").stat().st_mode), 0o600)
        self.assertEqual((directory / "recipient-fingerprint").read_text(encoding="ascii").strip(), self.fingerprint)

    def test_prepare_rejects_invalid_and_private_key_before_workspace_creation(self) -> None:
        cases = (("invalid", "not an OpenPGP key"), ("private", self.private_key))
        for name, key in cases:
            with self.subTest(name=name):
                directory = self.work / f"rejected-{name}"
                result = self._command(
                    "prepare",
                    "--directory",
                    os.fspath(directory),
                    environment=self._environment(IOS_ARTIFACT_PUBLIC_KEY=key),
                )
                console = (result.stdout + result.stderr).decode("utf-8", "replace")

                self.assertNotEqual(result.returncode, 0)
                self.assertNotIn(key, console)
                self.assertFalse(directory.exists())

    def test_log_stores_raw_input_without_echoing_secret_or_url(self) -> None:
        logs = self.work / "logs"
        logs.mkdir()
        log_path = logs / "xcodebuild.log"
        secret = "TOP_SECRET_DO_NOT_PRINT"
        payload = (
            b"/tmp/Build.swift:17:5: error: " + secret.encode("ascii") + b" https://example.invalid/token\n"
            b"https://example.invalid/" + secret.encode("ascii") + b"\n"
            b"** BUILD FAILED **\n"
        )
        result = self._command("log", "--file", os.fspath(log_path), input_data=payload)
        console = (result.stdout + result.stderr).decode("utf-8", "replace")

        self.assertEqual(result.returncode, 0, console)
        self.assertIn("Build.swift:17:5: error", console)
        self.assertIn("构建阶段失败。请查看受保护日志。", console)
        self.assertNotIn(secret, console)
        self.assertNotIn("https://", console)
        self.assertEqual(log_path.read_bytes(), payload)
        self.assertEqual(stat.S_IMODE(log_path.stat().st_mode), 0o600)

    def test_seal_encrypts_only_scoped_evidence_and_round_trips(self) -> None:
        directory = self._prepared_workspace("sealed")
        sealed_secret = b"RELEASE_SECRET_DO_NOT_PUBLISH"
        (directory / "logs" / "build.log").write_bytes(b"raw diagnostic: " + sealed_secret)

        archive = self.work / "archive.xcarchive"
        dwarf = archive / "dSYMs" / "Boji.app.dSYM" / "Contents" / "Resources" / "DWARF"
        dwarf.mkdir(parents=True)
        (dwarf / "Boji").write_bytes(b"symbols")
        (archive / "Boji.ipa").write_bytes(b"must stay outside the evidence")
        (archive / "profile.mobileprovision").write_bytes(b"must stay outside the evidence")
        (archive / "certificate.p12").write_bytes(b"must stay outside the evidence")
        receipt = self.work / "receipt.json"
        receipt.write_text('{"accepted":true}', encoding="utf-8")
        output = self.work / "public-output"

        result = self._command(
            "seal",
            "--directory",
            os.fspath(directory),
            "--archive",
            os.fspath(archive),
            "--receipt",
            os.fspath(receipt),
            "--output",
            os.fspath(output),
            environment=self._environment(
                GITHUB_SHA="a" * 40,
                GITHUB_RUN_ID="123456",
                GITHUB_RUN_ATTEMPT="4",
            ),
        )
        console = (result.stdout + result.stderr).decode("utf-8", "replace")
        ciphertext = output / "release-evidence.tar.gpg"

        self.assertEqual(result.returncode, 0, console)
        self.assertEqual([entry.name for entry in output.iterdir()], ["release-evidence.tar.gpg"])
        self.assertTrue(ciphertext.is_file())
        self.assertEqual(stat.S_IMODE(ciphertext.stat().st_mode), 0o600)
        self.assertNotIn(sealed_secret, ciphertext.read_bytes())

        plaintext = self.work / "round-trip.tar"
        decrypted = self._gpg("--yes", "--output", os.fspath(plaintext), "--decrypt", os.fspath(ciphertext))
        self.assertEqual(decrypted.returncode, 0, decrypted.stderr.decode("utf-8", "replace"))
        with tarfile.open(plaintext, "r") as evidence:
            names = evidence.getnames()
            manifest = json.loads(evidence.extractfile("manifest.json").read().decode("utf-8"))

        self.assertIn("logs/build.log", names)
        self.assertIn("dSYMs/Boji.app.dSYM/Contents/Resources/DWARF/Boji", names)
        self.assertIn("receipt/receipt.json", names)
        self.assertNotIn("Boji.ipa", names)
        self.assertNotIn("profile.mobileprovision", names)
        self.assertNotIn("certificate.p12", names)
        self.assertEqual(
            manifest,
            {"github": {"commit": "a" * 40, "run_attempt": "4", "run_id": "123456"}},
        )

    def test_seal_rejects_symbolic_links(self) -> None:
        directory = self._prepared_workspace("symlink")
        (directory / "logs" / "build.log").write_text("raw diagnostic", encoding="utf-8")
        archive = self.work / "linked.xcarchive"
        dsyms = archive / "dSYMs"
        dsyms.mkdir(parents=True)
        os.symlink(os.fspath(directory / "logs" / "build.log"), dsyms / "linked.dSYM")
        output = self.work / "rejected-output"

        result = self._command(
            "seal",
            "--directory",
            os.fspath(directory),
            "--archive",
            os.fspath(archive),
            "--receipt",
            os.fspath(self.work / "missing-receipt.json"),
            "--output",
            os.fspath(output),
        )

        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((output / "release-evidence.tar.gpg").exists())


if __name__ == "__main__":
    unittest.main()
