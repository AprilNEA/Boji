"""Read-only repository checks and CI-only simulator discovery."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'ios/app-store'))
import manage
from bootstrap import toolchain


def check_assets(root: Path = ROOT) -> int:
    folder = root / 'animations/lottie'
    index = json.loads((folder / 'index.json').read_text())
    ids = set()
    for row in index:
        name = row['id']
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', name) or name in ids:
            raise ValueError('Invalid or duplicated animation ID')
        ids.add(name)
        if not row.get('course') or not isinstance(row.get('posterFrame'), int):
            raise ValueError('Missing course or poster frame')
        if not 0 <= row['posterFrame'] < row['frames']:
            raise ValueError('Invalid poster frame')
        for theme in ('light', 'dark'):
            expected = f'{theme}/{name}.json'
            if row['files'][theme] != expected:
                raise ValueError('Animation path does not preserve theme directories')
            json.loads((folder / expected).read_text())
    for theme in ('light', 'dark'):
        if {p.stem for p in (folder / theme).glob('*.json')} != ids:
            raise ValueError('Animation files differ from the course index')
    return len(ids)


def check_xcode_project(root: Path = ROOT) -> None:
    project = root / 'ios/Boji.xcodeproj/project.pbxproj'
    if 'TEMP_' in project.read_text():
        raise ValueError('Generated Xcode project contains an unstable TEMP_ identifier')


def check_bundle(app: Path, root: Path = ROOT) -> None:
    source = root / 'animations/lottie'
    expected = {p.relative_to(source).as_posix() for p in source.rglob('*.json')}
    actual = {p.relative_to(app / 'lottie').as_posix() for p in (app / 'lottie').rglob('*.json')}
    if not expected or expected != actual:
        raise ValueError('Built app is missing or adding animation resources')
    for name in expected:
        if hashlib.sha256((source / name).read_bytes()).digest() != hashlib.sha256((app / 'lottie' / name).read_bytes()).digest():
            raise ValueError('Built animation differs from source')
    if list(app.rglob('lottie-library')) or list(app.rglob('*.tmp')):
        raise ValueError('Built app contains excluded resources')
    if list(app.rglob('RemoteAnimationFixtures')):
        raise ValueError('Built app contains Debug animation fixtures')
    for name in ('PlugIns/BojiWidgets.appex', 'Watch/BojiWatch.app'):
        if not (app / name).is_dir():
            raise ValueError(f'Missing embedded target: {name}')


def select_simulator(data: dict) -> str:
    candidates = []
    for runtime, devices in data['devices'].items():
        match = re.search(r'iOS-(\d+)-(\d+)(?:-(\d+))?$', runtime)
        if not match or int(match[1]) < 26:
            continue
        version = tuple(int(value or 0) for value in match.groups())
        for device in devices:
            if device.get('isAvailable') and device.get('name', '').startswith('iPhone'):
                candidates.append((version, device['name'] == 'iPhone 17', device['name'], device['udid']))
    if not candidates:
        raise ValueError('No available iPhone simulator with iOS 26 or later')
    return max(candidates)[-1]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['source', 'toolchain', 'simulator', 'bundle'])
    parser.add_argument('--app', type=Path)
    args = parser.parse_args()
    if args.action == 'source':
        check_xcode_project()
        config = manage.project()
        errors = manage.validate_files(manage.HERE / 'metadata', config)
        if errors:
            raise ValueError('\n'.join(errors))
        print(f'公开元数据通过；课程动画 {check_assets()} 个。')
    elif args.action == 'toolchain':
        config = toolchain()
        actual = subprocess.check_output(['xcodebuild', '-version'], text=True).splitlines()
        if actual != [f"Xcode {config['xcodeVersion']}", f"Build version {config['xcodeBuild']}"]:
            raise ValueError('Xcode differs from ios/ci/toolchain.json; do not silently use another version')
        print('\n'.join(actual))
    elif args.action == 'simulator':
        if os.environ.get('GITHUB_ACTIONS') != 'true':
            raise ValueError('Simulator discovery is for GitHub runners only; use AppSim locally')
        data = json.loads(subprocess.check_output(['xcrun', 'simctl', 'list', 'devices', 'available', '--json'], text=True))
        print(select_simulator(data))
    else:
        if not args.app:
            raise ValueError('--app is required')
        check_bundle(args.app)
        print('动画资源及嵌入目标检查通过。')


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
