from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, timezone
import hashlib
import json
import os
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

CI = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CI))
import check
import guard
import signing


class ProfileTests(unittest.TestCase):
    def setUp(self):
        self.bundle = 'club.leanmuscle.boji'
        self.cert = b'unit-test-certificate-not-a-real-certificate'
        self.fingerprint = hashlib.sha1(self.cert).hexdigest().upper()
        self.ent = {'com.apple.developer.healthkit': True,
                    'com.apple.developer.applesignin': ['Default'],
                    'com.apple.security.application-groups': ['group.club.leanmuscle.boji']}
        self.profile = {
            'UUID': '73EA184D-79EB-4560-AC23-D629A91A420E',
            'TeamIdentifier': [signing.TEAM], 'ApplicationIdentifierPrefix': [signing.TEAM],
            'ExpirationDate': datetime.now(timezone.utc) + timedelta(days=5),
            'DeveloperCertificates': [self.cert],
            'Entitlements': {**self.ent, 'application-identifier': signing.TEAM + '.' + self.bundle,
                             'com.apple.developer.team-identifier': signing.TEAM, 'get-task-allow': False},
        }

    def verify(self, profile=None):
        signing.validate_profile(profile or self.profile, self.bundle, self.ent, self.fingerprint)

    def test_valid_distribution_profile(self):
        self.verify()

    def test_development_profile_rejected(self):
        self.profile['Entitlements']['get-task-allow'] = True
        with self.assertRaises(ValueError): self.verify()

    def test_ad_hoc_and_enterprise_profiles_rejected(self):
        for key, value in [('ProvisionedDevices', ['test-device']), ('ProvisionsAllDevices', True)]:
            profile = deepcopy(self.profile)
            profile[key] = value
            with self.subTest(key=key), self.assertRaises(ValueError): self.verify(profile)

    def test_expired_profile_rejected(self):
        self.profile['ExpirationDate'] = datetime.now(timezone.utc) - timedelta(days=1)
        with self.assertRaises(ValueError): self.verify()

    def test_wrong_team_and_wildcard_rejected(self):
        profile = deepcopy(self.profile)
        profile['TeamIdentifier'] = ['OTHERTEAM']
        with self.assertRaises(ValueError): self.verify(profile)
        self.profile['Entitlements']['application-identifier'] = signing.TEAM + '.*'
        with self.assertRaises(ValueError): self.verify()

    def test_missing_capability_rejected(self):
        del self.profile['Entitlements']['com.apple.developer.healthkit']
        with self.assertRaises(ValueError): self.verify()

    def test_wrong_certificate_rejected(self):
        self.profile['DeveloperCertificates'] = [b'wrong']
        with self.assertRaises(ValueError): self.verify()

    def test_missing_group_rejected(self):
        self.profile['Entitlements']['com.apple.security.application-groups'] = []
        with self.assertRaises(ValueError): self.verify()

    def test_no_signing_outside_hosted_runner(self):
        with patch.dict(os.environ, {}, clear=True), self.assertRaises(ValueError):
            signing.prepare('0.7.0', '8')

    def test_private_command_error_does_not_include_password(self):
        from subprocess import CompletedProcess
        with patch.object(signing.subprocess, 'run', return_value=CompletedProcess([], 1, b'secret', b'secret')):
            with self.assertRaises(ValueError) as error:
                signing.run_private(['security', '-p', 'secret'])
            self.assertNotIn('secret', str(error.exception))


class ReleaseSpecTests(unittest.TestCase):
    def setUp(self):
        self.source = {
            'settings': {'base': {'MARKETING_VERSION': '1.0', 'CURRENT_PROJECT_VERSION': '7',
                                  'CODE_SIGN_STYLE': 'Automatic', 'BOJI_SENTRY_DSN': ''}},
            'targets': {name: {'settings': {'base': {'PRODUCT_BUNDLE_IDENTIFIER': bundle}},
                               'sources': [{'path': name}]}
                        for name, (bundle, _, _) in signing.TARGETS.items()},
            'packages': {'Lottie': {'exactVersion': '4.6.1'}, 'BojiAPI': {'path': 'BojiAPI'}},
            'schemes': {'Boji': {'build': {'targets': {'Boji': 'all'}}}},
        }
        self.profiles = {bundle: f'test-profile-{name}'
                         for name, (bundle, _, _) in signing.TARGETS.items()}

    def generate(self):
        return signing.release_spec(self.source, '1.0', '8', 'https://api.leanmuscle.club',
                                    self.profiles, 'A' * 40)

    def test_release_settings_and_all_three_profiles(self):
        spec = self.generate()
        settings = spec['settings']['base']
        self.assertEqual(settings['CURRENT_PROJECT_VERSION'], '8')
        self.assertEqual(settings['MARKETING_VERSION'], '1.0')
        self.assertEqual(settings['BOJI_API_BASE_URL'], 'https://api.leanmuscle.club')
        self.assertEqual(settings['BOJI_SENTRY_DSN'], '')
        for name, (bundle, _, _) in signing.TARGETS.items():
            with self.subTest(target=name):
                target = spec['targets'][name]['settings']['base']
                self.assertEqual(target['PRODUCT_BUNDLE_IDENTIFIER'], bundle)
                self.assertEqual(target['PROVISIONING_PROFILE_SPECIFIER'], self.profiles[bundle])
                self.assertEqual(target['DEVELOPMENT_TEAM'], signing.TEAM)
                self.assertEqual(target['CODE_SIGN_IDENTITY'], 'A' * 40)
                self.assertEqual(target['CODE_SIGN_STYLE'], 'Manual')

    def test_generation_preserves_source_resources_packages_and_schemes(self):
        settings = self.source['targets']['Boji']['settings']
        settings['base']['BOJI_ANIMATION_FIXTURE_DIR'] = '$(DERIVED_FILE_DIR)/RemoteAnimationFixtures'
        settings['configs'] = {'Debug': {'BOJI_ANIMATION_FIXTURE_DIR':
                                        '$(TARGET_BUILD_DIR)/$(UNLOCALIZED_RESOURCES_FOLDER_PATH)/RemoteAnimationFixtures'}}
        original = deepcopy(self.source)
        spec = self.generate()
        self.assertEqual(self.source, original)
        self.assertEqual(spec['packages'], original['packages'])
        self.assertEqual(spec['schemes'], original['schemes'])
        self.assertEqual(spec['targets']['Boji']['settings']['configs'], settings['configs'])
        self.assertEqual(spec['targets']['Boji']['settings']['base']['BOJI_ANIMATION_FIXTURE_DIR'],
                         settings['base']['BOJI_ANIMATION_FIXTURE_DIR'])
        for name in signing.TARGETS:
            self.assertEqual(spec['targets'][name]['sources'], original['targets'][name]['sources'])

    def test_missing_product_profile_stops_generation(self):
        del self.profiles['club.leanmuscle.boji.watchkitapp']
        with self.assertRaises(KeyError):
            self.generate()


class ProvenanceTests(unittest.TestCase):
    def setUp(self):
        self.sha = 'a' * 40
        self.env = {'GITHUB_REPOSITORY': guard.REPOSITORY, 'GITHUB_REF': 'refs/heads/master',
                    'GITHUB_EVENT_NAME': 'workflow_dispatch', 'IOS_RELEASE_ENABLED': 'true',
                    'RELEASE_ACTION': 'testflight'}
        self.run = {'path': guard.WORKFLOW, 'event': 'workflow_dispatch',
                    'head_branch': 'master', 'head_repository': {'full_name': guard.REPOSITORY},
                    'status': 'completed', 'conclusion': 'success', 'head_sha': self.sha,
                    'id': 1, 'run_attempt': 2}
        self.jobs = [{'name': name, 'status': 'completed', 'conclusion': 'success'}
                     for name in sorted(guard.TESTFLIGHT_JOBS)]

    def evidence(self, jobs=None):
        jobs = self.jobs if jobs is None else jobs
        return {'total_count': len(jobs), 'jobs': jobs}

    def test_trusted_dispatch(self):
        guard.trusted_dispatch(self.env)
        guard.trusted_dispatch({**self.env, 'RELEASE_ACTION': 'review'})

    def test_forks_branches_prs_and_disabled_release_rejected(self):
        for key, value in [('GITHUB_REPOSITORY', 'attacker/Boji'), ('GITHUB_REF', 'refs/heads/feature'),
                           ('GITHUB_EVENT_NAME', 'pull_request_target'), ('IOS_RELEASE_ENABLED', ''),
                           ('RELEASE_ACTION', 'ci'), ('RELEASE_ACTION', '')]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                guard.trusted_dispatch({**self.env, key: value})

    def test_matching_testflight_jobs_from_exact_attempt(self):
        with patch.object(guard, 'github', side_effect=[self.run, self.evidence()]) as api:
            self.assertEqual(guard.testflight_run('1'), self.run)
        self.assertEqual(api.call_args_list[0].args[0], 'actions/runs/1')
        self.assertEqual(api.call_args_list[1].args[0], 'actions/runs/1/attempts/2/jobs?per_page=100')

    def test_successful_ci_only_run_cannot_supply_release_receipt(self):
        jobs = [{**job, 'conclusion': 'skipped'} if job['name'] == 'testflight' else job for job in self.jobs]
        with patch.object(guard, 'github', side_effect=[self.run, self.evidence(jobs)]), self.assertRaises(ValueError):
            guard.testflight_run('1')

    def test_pr_run_cannot_supply_release_receipt(self):
        untrusted = {**self.run, 'event': 'pull_request'}
        with patch.object(guard, 'github', return_value=untrusted), self.assertRaises(ValueError):
            guard.testflight_run('1')

    def test_successful_review_run_cannot_supply_release_receipt(self):
        jobs = [{**job, 'conclusion': 'skipped'} for job in self.jobs]
        jobs.append({'name': 'review', 'status': 'completed', 'conclusion': 'success'})
        with patch.object(guard, 'github', side_effect=[self.run, self.evidence(jobs)]), self.assertRaises(ValueError):
            guard.testflight_run('1')

    def test_failed_or_skipped_required_job_rejects_source(self):
        for name in guard.TESTFLIGHT_JOBS:
            for state in ('failure', 'skipped', 'cancelled'):
                jobs = [{**job, 'conclusion': state} if job['name'] == name else job for job in self.jobs]
                with self.subTest(name=name, state=state), patch.object(guard, 'github', return_value=self.evidence(jobs)), self.assertRaises(ValueError):
                    guard.require_testflight_jobs(self.run)

    def test_missing_duplicate_and_incomplete_job_evidence_rejected(self):
        cases = [self.evidence(self.jobs[:-1]), self.evidence(self.jobs + [self.jobs[0]]),
                 {'total_count': 101, 'jobs': self.jobs}]
        for evidence in cases:
            with self.subTest(evidence=evidence), patch.object(guard, 'github', return_value=evidence), self.assertRaises(ValueError):
                guard.require_testflight_jobs(self.run)

    def test_wrong_sha_workflow_and_branch_rejected(self):
        for key, value in [('head_sha', 'b' * 40), ('path', '.github/workflows/other.yml'),
                           ('head_branch', 'feature'), ('event', 'pull_request'), ('conclusion', 'failure')]:
            with self.subTest(key=key), self.assertRaises(ValueError):
                guard.validate_run({**self.run, key: value}, self.run['path'], 'workflow_dispatch', self.sha)

    def test_injection_in_run_id_rejected_before_network(self):
        with patch.object(guard, 'github') as api, self.assertRaises(ValueError):
            guard.testflight_run('1; curl evil')
        api.assert_not_called()


class InputTests(unittest.TestCase):
    def test_testflight_inputs_require_public_backend_origin(self):
        import manage
        with patch.object(manage, 'project', return_value={'version': '1.0'}), patch.dict(os.environ, {}, clear=True):
            signing.validate_inputs('1.0', '8', 'https://api.leanmuscle.club')
            for endpoint in ('http://api.leanmuscle.club', 'https://127.0.0.1', 'https://localhost',
                             'https://api.leanmuscle.club/?token=secret', 'https://user:secret@api.leanmuscle.club'):
                with self.subTest(endpoint=endpoint), self.assertRaises(ValueError):
                    signing.validate_inputs('1.0', '8', endpoint)
            for number in ('0', '-1', '1; echo secret', '10000', '1.100', '1.2.3.4'):
                with self.subTest(number=number), self.assertRaises(ValueError):
                    signing.validate_inputs('1.0', number, 'https://api.leanmuscle.club')

    def test_testflight_does_not_claim_backend_acceptance(self):
        import manage
        with patch.object(manage, 'project', return_value={'version': '1.0'}), patch.dict(os.environ, {}, clear=True):
            signing.validate_inputs('1.0', '8', 'https://api.leanmuscle.club')
            self.assertNotIn('IOS_BACKEND_VERIFIED', os.environ)


class BundleTests(unittest.TestCase):
    def test_debug_animation_fixtures_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'animations/lottie'
            app = root / 'Boji.app'
            for path in (source / 'index.json', source / 'light/sample.json', source / 'dark/sample.json'):
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text('{}')
                destination = app / 'lottie' / path.relative_to(source)
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_text('{}')
            (app / 'PlugIns/BojiWidgets.appex').mkdir(parents=True)
            (app / 'Watch/BojiWatch.app').mkdir(parents=True)
            check.check_bundle(app, root)
            (app / 'RemoteAnimationFixtures').mkdir()
            with self.assertRaisesRegex(ValueError, 'Debug animation fixtures'):
                check.check_bundle(app, root)


class SourceTests(unittest.TestCase):
    def test_current_animation_sources(self):
        self.assertGreater(check.check_assets(), 0)

    def test_generated_project_has_no_temporary_identifiers(self):
        check.check_xcode_project()

    def test_temporary_project_identifier_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory) / 'ios/Boji.xcodeproj/project.pbxproj'
            project.parent.mkdir(parents=True)
            project.write_text('TEMP_1A2B3C4D /* DebugSupport */')
            with self.assertRaisesRegex(ValueError, 'unstable TEMP_ identifier'):
                check.check_xcode_project(Path(directory))

    def test_simulator_selection_is_not_a_local_udid(self):
        data = {'devices': {
            'com.apple.CoreSimulator.SimRuntime.iOS-26-5': [
                {'name': 'iPhone 17', 'udid': 'runner-17', 'isAvailable': True},
                {'name': 'iPad', 'udid': 'runner-pad', 'isAvailable': True}],
            'com.apple.CoreSimulator.SimRuntime.iOS-25-0': [
                {'name': 'iPhone', 'udid': 'old', 'isAvailable': True}],
        }}
        self.assertEqual(check.select_simulator(data), 'runner-17')

    def test_missing_simulator_stops(self):
        with self.assertRaises(ValueError): check.select_simulator({'devices': {}})

    def test_release_approval_defaults_closed(self):
        approval = json.loads((CI / 'release-approval.json').read_text())
        self.assertEqual(approval['schemaVersion'], 1)
        # The schema is permanent; actual values become true only after release acceptance.
        self.assertEqual(set(approval['checks']), {'backend', 'reviewAccess', 'privacy', 'legal', 'screenshots', 'exportCompliance'})
        self.assertTrue(all(type(value) is bool for value in approval['checks'].values()))

    def test_actions_are_sha_pinned_and_never_run_pr_target(self):
        import re
        paths = list((CI.parents[1] / '.github/workflows').glob('ios*.yml'))
        self.assertEqual([path.name for path in paths], ['ios.yml'])
        source = paths[0].read_text()
        self.assertNotIn('pull_request_target:', source)
        self.assertNotIn('self-hosted', source)
        for action in re.findall(r'uses: (\S+)', source):
            self.assertRegex(action, r'@[0-9a-f]{40}$')

    def test_single_workflow_keeps_ci_and_release_jobs_isolated(self):
        import re
        source = (CI.parents[1] / guard.WORKFLOW).read_text()
        sections = re.split(r'^  ([a-z-]+):\n', source.split('\njobs:\n', 1)[1], flags=re.MULTILINE)
        jobs = dict(zip(sections[1::2], sections[2::2]))
        self.assertEqual(set(jobs), guard.TESTFLIGHT_JOBS | {'review'})
        for name in guard.TESTFLIGHT_JOBS:
            self.assertIn(f'    name: {name}\n', jobs[name])
        for name in ('validate', 'build', 'release-gate'):
            self.assertNotIn('secrets.', jobs[name])
            self.assertNotIn('environment:', jobs[name])
        self.assertIn("github.event_name == 'workflow_dispatch'", jobs['release-gate'])
        self.assertIn("github.ref == 'refs/heads/master'", jobs['release-gate'])
        self.assertIn("github.repository == 'AprilNEA/Boji'", jobs['release-gate'])
        self.assertIn('needs: [release-gate, build]', jobs['testflight'])
        self.assertIn('environment: ios-testflight', jobs['testflight'])
        self.assertIn("inputs.action == 'testflight'", jobs['testflight'])
        self.assertIn('needs: release-gate', jobs['review'])
        self.assertIn('environment: ios-appstore-review', jobs['review'])
        self.assertIn("inputs.action == 'review'", jobs['review'])
        self.assertNotIn('xcodebuild', jobs['review'])
        self.assertNotIn('signing.py', jobs['review'])
        self.assertNotIn('store.py upload', jobs['review'])

    def test_workflow_repeats_the_pinned_toolchain(self):
        import re
        config = json.loads((CI / 'toolchain.json').read_text())
        source = (CI.parents[1] / guard.WORKFLOW).read_text()
        sections = re.split(r'^  ([a-z-]+):\n', source.split('\njobs:\n', 1)[1], flags=re.MULTILINE)
        jobs = dict(zip(sections[1::2], sections[2::2]))
        macos = {name for name, body in jobs.items() if 'DEVELOPER_DIR:' in body}
        self.assertEqual(macos, {'validate', 'build', 'testflight'})
        for name in macos:
            self.assertIn(f"    runs-on: {config['runner']}\n", jobs[name])
            self.assertIn(f"      DEVELOPER_DIR: {config['xcodePath']}\n", jobs[name])
        for name in set(jobs) - macos:
            self.assertRegex(jobs[name], r'\n    runs-on: ubuntu-\d+\.\d+\n')
        self.assertEqual(set(re.findall(r"node-version: '([^']+)'", source)), {config['nodeVersion']})
        self.assertEqual(set(re.findall(r'pnpm@([0-9.]+)', source)), {config['pnpmVersion']})

    def test_review_mode_skips_build_and_store_runs_are_not_cancelled(self):
        source = (CI.parents[1] / guard.WORKFLOW).read_text()
        self.assertIn("if: github.event_name != 'workflow_dispatch' || inputs.action == 'ci' || inputs.action == 'testflight'", source)
        self.assertIn("cancel-in-progress: ${{ github.event_name != 'workflow_dispatch' || inputs.action == 'ci' }}", source)
        self.assertIn("inputs.action != 'ci' && 'ios-store-write'", source)


if __name__ == '__main__':
    unittest.main()
