from __future__ import annotations

import base64
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import plistlib
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

CI = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CI))
import signing


class SigningLifecycleTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.directory = self.root / 'boji-signing'
        self.profiles = self.root / 'profiles'
        self.cert = b'fixture-certificate-only'
        self.fingerprint = hashlib.sha1(self.cert).hexdigest().upper()
        self.environment = {'IOS_DISTRIBUTION_P12_BASE64': base64.b64encode(b'fixture-p12').decode(),
                            'IOS_DISTRIBUTION_P12_PASSWORD': 'fixture-password',
                            'BOJI_API_BASE_URL': 'https://api.example.invalid'}
        self.profile_data = {}
        self.spec = {'settings': {'base': {}}, 'targets': {}}
        for index, (target, (bundle, secret, entitlements)) in enumerate(signing.TARGETS.items(), 1):
            path = self.root / 'ios' / entitlements
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(plistlib.dumps({}))
            self.environment[secret] = base64.b64encode(b'fixture-profile').decode()
            self.profile_data[target] = {
                'UUID': f'00000000-0000-0000-0000-{index:012d}',
                'TeamIdentifier': [signing.TEAM], 'ApplicationIdentifierPrefix': [signing.TEAM],
                'ExpirationDate': datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=2),
                'DeveloperCertificates': [self.cert],
                'Entitlements': {'application-identifier': f'{signing.TEAM}.{bundle}',
                                 'com.apple.developer.team-identifier': signing.TEAM,
                                 'get-task-allow': False},
            }
            self.spec['targets'][target] = {'settings': {'base': {'PRODUCT_BUNDLE_IDENTIFIER': bundle}}}
        for patcher in (patch.object(signing, 'ROOT', self.root),
                        patch.object(signing, 'signing_directory', return_value=self.directory),
                        patch.object(signing, 'profile_directory', return_value=self.profiles),
                        patch.object(signing, 'validate_inputs'),
                        patch.dict(os.environ, self.environment, clear=True)):
            patcher.start()
            self.addCleanup(patcher.stop)

    def private_command(self, args, **kwargs):
        if args[:3] == ['security', 'list-keychains', '-d'] and '-s' not in args:
            return b'"/fixture/login.keychain-db"\n'
        if args[:2] == ['security', 'create-keychain']:
            Path(args[-1]).touch()
        if args[:2] == ['security', 'find-identity']:
            return f'1) {self.fingerprint} "Apple Distribution: Fixture"\n'.encode()
        if args[:2] == ['security', 'cms']:
            return plistlib.dumps(self.profile_data[Path(args[-1]).stem])
        if args[:2] == ['xcodegen', 'dump']:
            return json.dumps(self.spec).encode()
        return b''

    def cleanup(self, returncode=0):
        with patch.object(signing.subprocess, 'run', return_value=subprocess.CompletedProcess([], returncode)) as commands:
            signing.cleanup()
        return commands

    def test_prepare_does_not_build_and_persists_only_cleanup_state(self):
        with patch.object(signing, 'run_private', side_effect=self.private_command) as commands:
            signing.prepare('1.0', '8')
        self.assertFalse(any(call.args[0][0] == 'xcodebuild' for call in commands.call_args_list))
        self.assertEqual(len(list(self.profiles.glob('*.mobileprovision'))), 3)
        self.assertFalse((self.directory / 'distribution.p12').exists())
        state = json.loads((self.directory / 'cleanup.json').read_text())
        self.assertEqual(state['keychains'], ['/fixture/login.keychain-db'])
        self.assertEqual(len(state['profiles']), 3)
        self.assertNotIn('password', json.dumps(state))
        self.assertEqual((self.directory / 'cleanup.json').stat().st_mode & 0o777, 0o600)
        options = plistlib.loads((self.directory / 'ExportOptions.plist').read_bytes())
        self.assertEqual(options['method'], 'app-store-connect')
        self.assertIs(options['manageAppVersionAndBuildNumber'], False)
        self.assertEqual(len(options['provisioningProfiles']), 3)
        calls = self.cleanup()
        self.assertFalse(self.directory.exists())
        self.assertEqual(list(self.profiles.iterdir()), [])
        self.assertTrue(any(call.args[0][:2] == ['security', 'delete-keychain'] for call in calls.call_args_list))

    def test_partial_prepare_can_be_cleaned_without_deleting_other_profiles(self):
        self.profiles.mkdir()
        unrelated = self.profiles / 'unrelated.mobileprovision'
        unrelated.write_bytes(b'untouched')
        self.profile_data['BojiWidgets']['Entitlements']['get-task-allow'] = True
        with patch.object(signing, 'run_private', side_effect=self.private_command), self.assertRaises(ValueError):
            signing.prepare('1.0', '8')
        self.assertEqual(len(list(self.profiles.glob('*.mobileprovision'))), 2)
        self.cleanup()
        self.assertEqual(list(self.profiles.iterdir()), [unrelated])
        self.assertEqual(unrelated.read_bytes(), b'untouched')

    def test_cleanup_attempts_file_removal_even_when_keychain_command_fails(self):
        with patch.object(signing, 'run_private', side_effect=self.private_command):
            signing.prepare('1.0', '8')
        with self.assertRaises(ValueError):
            self.cleanup(returncode=1)
        self.assertFalse(self.directory.exists())
        self.assertEqual(list(self.profiles.iterdir()), [])

    def test_cleanup_rejects_profile_path_injection(self):
        self.directory.mkdir()
        (self.directory / 'cleanup.json').write_text(json.dumps({'keychains': [], 'profiles': ['../unrelated']}))
        with patch.object(signing.subprocess, 'run') as command, self.assertRaises(ValueError):
            signing.cleanup()
        command.assert_not_called()

    def test_cleanup_without_prepare_is_noop(self):
        with patch.object(signing.subprocess, 'run') as command:
            signing.cleanup()
        command.assert_not_called()


class VisibleWorkflowTests(unittest.TestCase):
    def test_archive_export_and_cleanup_are_visible_in_yaml(self):
        source = (CI.parents[1] / '.github/workflows/ios.yml').read_text()
        start = source.index('\n  testflight:')
        end = source.index('\n  review:')
        release = source[start:end]
        names = ['Prepare signing certificates and profiles', 'Archive signed iOS app', 'Export IPA',
                 'Upload IPA to App Store Connect and wait for processing', 'Encrypt build logs and dSYMs',
                 'Save encrypted diagnostics only', 'Clean up signing and plaintext build files']
        positions = [release.index('name: ' + name) for name in names]
        self.assertEqual(positions, sorted(positions))
        self.assertIn('xcodebuild -project', release)
        self.assertIn('xcodebuild -exportArchive', release)
        self.assertIn('signing.py prepare', release)
        self.assertIn('signing.py cleanup || status=$?', release)
        self.assertIn('if: always() && steps.evidence.outcome', release)
        self.assertIn('if: always() && steps.seal.outcome', release)
        self.assertIn('release-evidence.tar.gpg', release)
        self.assertNotIn('path: ${{ runner.temp }}/boji-archive', release)
        self.assertNotIn('path: ${{ runner.temp }}/boji-private-evidence', release)
        self.assertEqual(release.count('set -o pipefail'), 3)

    def test_exported_ipa_is_checked_before_loading_upload_credentials(self):
        source = (CI.parents[1] / '.github/workflows/ios.yml').read_text()
        name = 'Validate exported IPA before loading upload credentials'
        start = source.index('- name: ' + name)
        end = source.index('      - name:', start + 1)
        step = source[start:end]
        self.assertIn('store.py upload', step)
        self.assertNotIn('--apply', step)
        self.assertNotIn('secrets.', step)
        self.assertLess(source.index('- name: Export IPA'), start)
        self.assertLess(start, source.index('- name: Load App Store Connect credentials'))

    def test_log_pipeline_preserves_build_exit_code(self):
        with tempfile.TemporaryDirectory() as temporary:
            log = Path(temporary) / 'archive.log'
            environment = {**os.environ, 'PYTHON': sys.executable,
                           'LOGGER': str(CI / 'artifacts.py'), 'LOG': str(log)}
            result = subprocess.run(
                ['bash', '-o', 'pipefail', '-c',
                 '(printf "Boji.swift:12:2: error: fixture-secret\\n"; exit 7) | "$PYTHON" "$LOGGER" log --file "$LOG"'],
                env=environment, capture_output=True, text=True)
            self.assertEqual(result.returncode, 7)
            self.assertNotIn('fixture-secret', result.stdout + result.stderr)
            self.assertIn('fixture-secret', log.read_text())


if __name__ == '__main__':
    unittest.main()
