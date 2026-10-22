"""Fast source checks for the metadata Apple rejected in the first beta."""
import json
from pathlib import Path
import plistlib
import re
import unittest

ROOT = Path(__file__).resolve().parents[3]


class PackageSourceTests(unittest.TestCase):
    def test_health_purpose_strings_are_present_in_both_languages(self):
        info = plistlib.loads((ROOT / 'ios/Boji/Info.plist').read_bytes())
        catalog = json.loads((ROOT / 'ios/Boji/Resources/InfoPlist.xcstrings').read_text())
        for key in ('NSHealthShareUsageDescription', 'NSHealthUpdateUsageDescription'):
            self.assertTrue(info.get(key, '').strip())
            for language in ('en', 'zh-Hans'):
                unit = catalog['strings'][key]['localizations'][language]['stringUnit']
                self.assertEqual(unit['state'], 'translated')
                self.assertTrue(unit['value'].strip())

    def test_widget_has_a_display_name_and_both_localizations(self):
        info = plistlib.loads((ROOT / 'ios/BojiWidgets/Info.plist').read_bytes())
        catalog = json.loads((ROOT / 'ios/BojiWidgets/InfoPlist.xcstrings').read_text())
        self.assertEqual(info['CFBundleDisplayName'], 'Lean Muscle')
        for language, value in (('en', 'Lean Muscle'), ('zh-Hans', '薄肌')):
            unit = catalog['strings']['CFBundleDisplayName']['localizations'][language]['stringUnit']
            self.assertEqual(unit, {'state': 'translated', 'value': value})

    def test_watch_compiles_the_shared_icon_composer_document(self):
        source = (ROOT / 'ios/project.yml').read_text()
        target = source.split('\n  BojiWatch:\n', 1)[1].split('\n  BojiTests:\n', 1)[0]
        self.assertIn('path: Boji/Resources/AppIcon.icon', target)
        self.assertIn('ASSETCATALOG_COMPILER_APPICON_NAME: AppIcon', target)
        icon = json.loads((ROOT / 'ios/Boji/Resources/AppIcon.icon/icon.json').read_text())
        self.assertIn('watchOS', icon['supported-platforms']['circles'])

    def test_ipad_supports_all_four_orientations(self):
        source = (ROOT / 'ios/project.yml').read_text()
        match = re.search(r"INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad: '([^']+)'", source)
        self.assertIsNotNone(match)
        self.assertEqual(set(match[1].split()), {
            'UIInterfaceOrientationPortrait', 'UIInterfaceOrientationPortraitUpsideDown',
            'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight',
        })


if __name__ == '__main__':
    unittest.main()
