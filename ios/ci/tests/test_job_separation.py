from __future__ import annotations

from itertools import product
from pathlib import Path
import re
import sys
import unittest
from unittest.mock import patch

CI = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(CI))
import guard


class JobSeparationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (CI.parents[1] / guard.WORKFLOW).read_text()
        sections = re.split(r'^  ([a-z-]+):\n', cls.source.split('\njobs:\n', 1)[1], flags=re.MULTILINE)
        cls.jobs = dict(zip(sections[1::2], sections[2::2]))

    def test_build_compiles_both_configurations_without_running_tests(self):
        build = self.jobs['build']
        self.assertIn('-configuration Debug', build)
        self.assertIn('-configuration Release', build)
        self.assertEqual(build.count("-destination 'generic/platform=iOS Simulator'"), 2)
        self.assertEqual(build.count('BOJI_SENTRY_DSN= build'), 2)
        self.assertNotRegex(build, r'\b(?:test|test-without-building|build-for-testing|unittest|pytest|xctest)\b')
        self.assertNotIn('.xcresult', build)
        self.assertNotIn('SIMULATOR_UDID', build)
        self.assertNotRegex(build, r'check\.py\s+(?:simulator|bundle)')
        self.assertNotIn('store.py', build)

    def test_build_and_tests_are_independent_after_validation(self):
        for name in ('build', 'test'):
            with self.subTest(job=name):
                body = self.jobs[name]
                self.assertRegex(body, r'(?m)^    needs: validate$')
                self.assertNotIn('continue-on-error:', body)
        self.assertIn('timeout-minutes: 30', self.jobs['build'])
        self.assertIn('timeout-minutes: 60', self.jobs['test'])

    def test_test_job_preserves_full_isolated_test_suite(self):
        body = self.jobs['test']
        self.assertIn('check.py simulator', body)
        self.assertIn('-configuration Debug', body)
        self.assertIn('-parallel-testing-enabled NO', body)
        self.assertIn('CODE_SIGNING_ALLOWED=NO', body)
        self.assertIn('BOJI_API_BASE_URL= BOJI_SENTRY_DSN= test', body)
        self.assertIn('-resultBundlePath .work/boji-ios/ci/reports/tests.xcresult', body)
        self.assertNotIn('-skip-testing', body)
        self.assertNotIn('-only-testing', body)
        self.assertNotIn('-configuration Release', body)

    def test_testflight_accepts_only_success_or_explicitly_skipped_tests(self):
        body = self.jobs['testflight']
        match = re.search(r'^    needs: \[([^\]]+)\]$', body, re.MULTILINE)
        self.assertIsNotNone(match)
        self.assertEqual({part.strip() for part in match.group(1).split(',')}, {'release-gate', 'build', 'test'})
        condition = re.search(r'^    if: (.+)$', body, re.MULTILINE).group(1)
        expected = ("${{ !cancelled() && github.event_name == 'workflow_dispatch' && inputs.action == 'testflight' "
                    "&& needs.release-gate.result == 'success' && needs.build.result == 'success' "
                    "&& (needs.test.result == 'success' || (inputs.skip_tests && needs.test.result == 'skipped')) }}")
        self.assertEqual(condition, expected)
        expression = condition[3:-2].strip()
        for old, new in [('!cancelled()', 'not cancelled'), ('github.event_name', 'event'),
                         ('inputs.action', 'action'), ('needs.release-gate.result', 'gate'),
                         ('needs.build.result', 'build'), ('needs.test.result', 'tests'),
                         ('inputs.skip_tests', 'skip'), ('&&', 'and'), ('||', 'or')]:
            expression = expression.replace(old, new)
        # Evaluate the exact, asserted expression above with no callable globals.
        states = ('success', 'failure', 'cancelled', 'skipped')
        for gate, build, tests, skip, cancelled, event, action in product(
                states, states, states, (False, True), (False, True),
                ('push', 'pull_request', 'workflow_dispatch'), ('ci', 'testflight', 'review')):
            values = dict(gate=gate, build=build, tests=tests, skip=skip, cancelled=cancelled, event=event, action=action)
            wanted = (not cancelled and event == 'workflow_dispatch' and action == 'testflight'
                      and gate == build == 'success' and (tests == 'success' or (skip and tests == 'skipped')))
            with self.subTest(**values):
                self.assertEqual(eval(expression, {'__builtins__': {}}, values), wanted)
        self.assertIn('environment: ios-testflight', body)

    def test_skipping_tests_is_opt_in_and_only_for_manual_testflight(self):
        condition = "${{ !(github.event_name == 'workflow_dispatch' && inputs.action == 'testflight' && inputs.skip_tests) }}"
        self.assertIn('    if: ' + condition, self.jobs['test'])
        self.assertIn('        if: ' + condition, self.jobs['validate'])
        inputs = self.source.split('      skip_tests:\n', 1)[1].split('      version:\n', 1)[0]
        self.assertIn('type: boolean', inputs)
        self.assertIn('default: false', inputs)
        self.assertIn(' / tests skipped', self.source.splitlines()[1])
        self.assertIn('Record explicitly skipped beta tests', self.jobs['testflight'])

    def test_release_provenance_explicitly_requires_test_success(self):
        self.assertEqual(guard.TESTFLIGHT_JOBS, {'validate', 'build', 'test', 'release-gate', 'testflight'})
        jobs = [{'name': name, 'status': 'completed', 'conclusion': 'success'}
                for name in guard.TESTFLIGHT_JOBS - {'test'}]
        with patch.object(guard, 'github', return_value={'total_count': len(jobs), 'jobs': jobs}):
            with self.assertRaises(ValueError):
                guard.require_testflight_jobs({'id': 1, 'run_attempt': 1})

    def test_resource_validation_moves_to_archive_before_export(self):
        body = self.jobs['testflight']
        self.assertEqual(self.source.count('check.py bundle'), 1)
        self.assertIn('--app "$ARCHIVE_PATH/Products/Applications/Boji.app"', body)
        self.assertLess(body.index('- name: Archive signed iOS app'), body.index('- name: Verify archived resources'))
        self.assertLess(body.index('- name: Verify archived resources'), body.index('- name: Export IPA'))

    def test_build_and_test_evidence_use_separate_names_and_paths(self):
        build, tests = self.jobs['build'], self.jobs['test']
        self.assertIn('name: ios-build-evidence-${{ github.run_id }}-${{ github.run_attempt }}', build)
        self.assertIn('path: .work/boji-ios/ci/build-logs/', build)
        self.assertIn('name: ios-ci-evidence-${{ github.run_id }}-${{ github.run_attempt }}', tests)
        self.assertIn('path: .work/boji-ios/ci/reports/', tests)
        for body in (build, tests):
            self.assertIn('if: always()', body)
            self.assertIn('retention-days: 7', body)
            self.assertNotIn('secrets.', body)
            self.assertNotIn('1password/', body)


if __name__ == '__main__':
    unittest.main()
