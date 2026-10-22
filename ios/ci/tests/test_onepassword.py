from __future__ import annotations

from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[3]
WORKFLOW = ROOT / '.github/workflows/ios.yml'
ACTION = '1password/load-secrets-action@70062d7a876d3eb6334754fa26efd2fbd90c32f2'
SIGNING_FIELDS = (
    'IOS_DISTRIBUTION_P12_BASE64',
    'IOS_DISTRIBUTION_P12_PASSWORD',
    'IOS_APP_PROFILE_BASE64',
    'IOS_WIDGET_PROFILE_BASE64',
    'IOS_WATCH_PROFILE_BASE64',
)
ASC_FIELDS = ('ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_PRIVATE_KEY_P8')


class OnePasswordWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = WORKFLOW.read_text()

    def job(self, name: str) -> str:
        match = re.search(rf'^  {re.escape(name)}:\n(?P<body>.*?)(?=^  [a-z-]+:\n|\Z)',
                          self.source, re.MULTILINE | re.DOTALL)
        self.assertIsNotNone(match, name)
        return match.group('body')

    def step(self, job: str, name: str) -> str:
        match = re.search(rf'^      - name: {re.escape(name)}\n(?P<body>.*?)(?=^      - |\Z)',
                          job, re.MULTILINE | re.DOTALL)
        self.assertIsNotNone(match, name)
        return match.group(0)

    def assert_item_reference_check(self, step: str, variable: str) -> None:
        self.assertIn(f'{variable}: ${{{{ vars.{variable} }}}}', step)
        self.assertIn(f'[[ "${variable}" =~ ^op://[^/]+/[^/]+$ ]]', step)
        self.assertIn(f"'{variable} must be an op://vault-id/item-id reference'", step)
        run = step.split('run: |', 1)[1]
        self.assertNotIn('${{', run)

    def assert_loader(self, step: str, item_variable: str, fields: tuple[str, ...]) -> None:
        self.assertIn(f'uses: {ACTION} # v5.0.1', step)
        self.assertIn('export-env: false', step)
        self.assertIn('OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}', step)
        self.assertNotIn('run:', step)
        # v5.0.1 reads op:// references from env; it has no `secrets` input.
        self.assertNotIn('secrets: |', step)
        environment = step.split('        env:\n', 1)[1]
        mappings = re.findall(
            rf'^          ([A-Z0-9_]+): \$\{{\{{ vars\.{item_variable} \}}\}}/([A-Z0-9_]+)$',
            environment, re.MULTILINE)
        self.assertEqual(mappings, [(field, field) for field in fields])

    def test_service_account_is_scoped_to_pinned_loader_steps(self):
        loaders = re.findall(
            rf'^      - name: Load .*?^        uses: {re.escape(ACTION)} # v5\.0\.1\n.*?(?=^      - |\Z)',
            self.source, re.MULTILINE | re.DOTALL)
        self.assertEqual(len(loaders), 3)
        self.assertEqual(self.source.count(f'uses: {ACTION}'), 3)
        self.assertEqual(self.source.count('export-env: false'), 3)
        self.assertNotIn('export-env: true', self.source)
        for loader in loaders:
            self.assertIn('OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}', loader)
        without_loaders = self.source
        for loader in loaders:
            without_loaders = without_loaders.replace(loader, '')
        self.assertNotIn('OP_SERVICE_ACCOUNT_TOKEN', without_loaders)

    def test_secret_expressions_never_enter_run_scripts(self):
        scripts = re.findall(r'^        run: \|\n(?P<body>.*?)(?=^      - |^  [a-z-]+:\n|\Z)',
                             self.source, re.MULTILINE | re.DOTALL)
        self.assertGreater(len(scripts), 0)
        self.assertNotRegex(self.source, r'^\s+run:.*\$\{\{ secrets\.', re.MULTILINE)
        for script in scripts:
            self.assertNotIn('${{ secrets.', script)

    def test_testflight_loads_only_required_fields_before_each_consumer(self):
        testflight = self.job('testflight')
        signing_check = self.step(testflight, 'Check 1Password signing item reference')
        signing_loader = self.step(testflight, 'Load signing credentials from 1Password')
        prepare = self.step(testflight, 'Prepare signing certificates and profiles')
        self.assert_item_reference_check(signing_check, 'OP_IOS_SIGNING_ITEM')
        self.assert_loader(signing_loader, 'OP_IOS_SIGNING_ITEM', SIGNING_FIELDS)
        self.assertLess(testflight.index(signing_check), testflight.index(signing_loader))
        self.assertLess(testflight.index(signing_loader), testflight.index(prepare))
        for field in SIGNING_FIELDS:
            self.assertIn(f'{field}: ${{{{ steps.signing-secrets.outputs.{field} }}}}', prepare)
            self.assertNotIn(f'secrets.{field}', self.source)

        asc_check = self.step(testflight, 'Check 1Password App Store Connect item reference')
        asc_loader = self.step(testflight, 'Load App Store Connect credentials from 1Password')
        upload = self.step(testflight, 'Upload IPA to App Store Connect and wait for processing')
        self.assert_item_reference_check(asc_check, 'OP_ASC_SECRET_ITEM')
        self.assert_loader(asc_loader, 'OP_ASC_SECRET_ITEM', ASC_FIELDS)
        self.assertLess(testflight.index(asc_check), testflight.index(asc_loader))
        self.assertLess(testflight.index(asc_loader), testflight.index(upload))
        for field in ASC_FIELDS:
            self.assertIn(f'{field}: ${{{{ steps.asc-secrets.outputs.{field} }}}}', upload)
            self.assertNotIn(f'secrets.{field}', self.source)

    def test_review_loads_asc_fields_only_before_remote_check_or_submission(self):
        review = self.job('review')
        check = self.step(review, 'Check 1Password App Store Connect item reference')
        loader = self.step(review, 'Load App Store Connect credentials from 1Password')
        submit = self.step(review, 'Check or submit the tested build without rebuilding')
        self.assert_item_reference_check(check, 'OP_ASC_SECRET_ITEM')
        self.assert_loader(loader, 'OP_ASC_SECRET_ITEM', ASC_FIELDS)
        self.assertLess(review.index(check), review.index(loader))
        self.assertLess(review.index(loader), review.index(submit))
        for field in ASC_FIELDS:
            self.assertIn(f'{field}: ${{{{ steps.asc-secrets.outputs.{field} }}}}', submit)

    def test_ci_and_release_gate_cannot_read_service_account_or_item_references(self):
        for name in ('validate', 'build', 'test', 'release-gate'):
            with self.subTest(job=name):
                job = self.job(name)
                self.assertNotIn('1password/', job)
                self.assertNotIn('OP_SERVICE_ACCOUNT_TOKEN', job)
                self.assertNotIn('OP_IOS_SIGNING_ITEM', job)
                self.assertNotIn('OP_ASC_SECRET_ITEM', job)


if __name__ == '__main__':
    unittest.main()
