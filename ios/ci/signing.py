"""Prepare and clean up signing; xcodebuild stays visible in ios.yml."""
from __future__ import annotations

import argparse
import base64
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import secrets
import shlex
import shutil
import subprocess
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[2]
TARGETS = {
    'Boji': ('club.leanmuscle.boji', 'IOS_APP_PROFILE_BASE64', 'Boji/Boji.entitlements'),
    'BojiWidgets': ('club.leanmuscle.boji.widgets', 'IOS_WIDGET_PROFILE_BASE64', 'BojiWidgets/BojiWidgets.entitlements'),
    'BojiWatch': ('club.leanmuscle.boji.watchkitapp', 'IOS_WATCH_PROFILE_BASE64', 'BojiWatch/BojiWatch.entitlements'),
}
TEAM = '8U3ZJ258K9'
UUID_RE = re.compile(r'[0-9A-Fa-f]{8}(?:-[0-9A-Fa-f]{4}){3}-[0-9A-Fa-f]{12}')


def validate_inputs(version: str, build: str, api: str) -> None:
    if not re.fullmatch(r'\d+\.\d+(?:\.\d+)?', version):
        raise ValueError('Invalid marketing version')
    if not re.fullmatch(r'[1-9]\d{0,3}(?:\.\d{1,2}){0,2}', build):
        raise ValueError('Build must use Apple numeric version components')
    sys.path.insert(0, str(ROOT / 'ios/app-store'))
    from manage import project, valid_url
    if project()['version'] != version:
        raise ValueError('Version must match both project.yml and app-store/project.json')
    url = urlsplit(api)
    if not valid_url(api) or url.query or url.fragment or url.path not in ('', '/'):
        raise ValueError('A public HTTPS API origin without query, fragment or path is required')
    if os.environ.get('IOS_BACKEND_VERIFIED') != 'true':
        raise ValueError('The release backend contract and login must be verified first')


def validate_profile(profile: dict, bundle: str, expected: dict, fingerprint: str, now=None) -> None:
    now = now or datetime.now(timezone.utc)
    expiry = profile.get('ExpirationDate')
    if not isinstance(expiry, datetime):
        raise ValueError('Missing profile expiration')
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
    ent = profile.get('Entitlements', {})
    prefixes = profile.get('ApplicationIdentifierPrefix', [])
    if (not UUID_RE.fullmatch(profile.get('UUID', ''))
            or profile.get('TeamIdentifier') != [TEAM]
            or ent.get('com.apple.developer.team-identifier') != TEAM
            or not prefixes or ent.get('application-identifier') != prefixes[0] + '.' + bundle):
        raise ValueError('Profile does not match the explicit app and team')
    if expiry <= now or ent.get('get-task-allow') is not False:
        raise ValueError('Expired or development provisioning profile')
    if 'ProvisionedDevices' in profile or profile.get('ProvisionsAllDevices'):
        raise ValueError('Only App Store distribution profiles are accepted')
    certificates = profile.get('DeveloperCertificates', [])
    if fingerprint.upper() not in {hashlib.sha1(cert).hexdigest().upper() for cert in certificates}:
        raise ValueError('Profile does not contain the imported distribution certificate')
    for key, required in expected.items():
        actual = ent.get(key)
        if isinstance(required, list):
            if not isinstance(actual, list) or not set(required).issubset(actual):
                raise ValueError(f'Profile is missing capability: {key}')
        elif actual != required:
            raise ValueError(f'Profile is missing capability: {key}')


def run_private(args: list[str], **kwargs) -> bytes:
    # Only sensitive setup commands use this helper, never compilation.
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, **kwargs)
    if result.returncode:
        raise ValueError(f'{Path(args[0]).name} failed; no sensitive output was published')
    return result.stdout


def write_private(path: Path, data: bytes) -> None:
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'wb') as file:
        file.write(data)


def decode_secret(name: str, path: Path) -> None:
    value = os.environ.get(name, '')
    if not value:
        raise ValueError(f'Missing {name}')
    data = base64.b64decode(''.join(value.split()), validate=True)
    if not data:
        raise ValueError(f'Empty {name}')
    write_private(path, data)


def release_spec(source: dict, version: str, build: str, api: str,
                 profiles: dict[str, str], fingerprint: str) -> dict:
    """Create disposable signing settings without modifying the source spec."""
    spec = deepcopy(source)
    spec['settings']['base'].update({
        'MARKETING_VERSION': version, 'CURRENT_PROJECT_VERSION': build,
        'BOJI_API_BASE_URL': api, 'BOJI_SENTRY_DSN': '', 'CODE_SIGN_STYLE': 'Manual',
    })
    for target, (bundle, _, _) in TARGETS.items():
        spec['targets'][target]['settings']['base'].update({
            'PROVISIONING_PROFILE_SPECIFIER': profiles[bundle], 'CODE_SIGN_STYLE': 'Manual',
            'DEVELOPMENT_TEAM': TEAM, 'CODE_SIGN_IDENTITY': fingerprint,
        })
    return spec


def export_options(profiles: dict[str, str], fingerprint: str) -> dict:
    return {
        'method': 'app-store-connect', 'destination': 'export', 'teamID': TEAM,
        'signingStyle': 'manual', 'signingCertificate': fingerprint,
        'provisioningProfiles': profiles, 'manageAppVersionAndBuildNumber': False,
        'uploadSymbols': True,
    }


def signing_directory() -> Path:
    if (os.environ.get('GITHUB_ACTIONS') != 'true'
            or os.environ.get('RUNNER_ENVIRONMENT') != 'github-hosted'
            or os.environ.get('GITHUB_REPOSITORY') != 'AprilNEA/Boji'
            or os.environ.get('GITHUB_REF') != 'refs/heads/master'
            or os.environ.get('GITHUB_EVENT_NAME') != 'workflow_dispatch'):
        raise ValueError('Signing requires a manual master job on a disposable GitHub-hosted runner')
    directory = Path(os.environ['RUNNER_TEMP']) / 'boji-signing'
    if directory.is_symlink():
        raise ValueError('Signing directory cannot be a symlink')
    return directory


def profile_directory() -> Path:
    return Path.home() / 'Library/Developer/Xcode/UserData/Provisioning Profiles'


def prepare(version: str, build: str) -> None:
    directory = signing_directory()
    api = os.environ.get('BOJI_API_BASE_URL', '')
    validate_inputs(version, build, api)
    directory.mkdir(mode=0o700)
    keychain = directory / 'distribution.keychain-db'
    state_path = directory / 'cleanup.json'
    state = {'keychains': shlex.split(run_private(['security', 'list-keychains', '-d', 'user']).decode()),
             'profiles': []}
    write_private(state_path, json.dumps(state).encode())
    print('准备临时 Keychain 和分发证书。', flush=True)
    password = secrets.token_urlsafe(32)
    p12 = directory / 'distribution.p12'
    decode_secret('IOS_DISTRIBUTION_P12_BASE64', p12)
    p12_password = os.environ.get('IOS_DISTRIBUTION_P12_PASSWORD')
    if p12_password is None:
        raise ValueError('Missing IOS_DISTRIBUTION_P12_PASSWORD')
    run_private(['security', 'create-keychain', '-p', password, str(keychain)])
    run_private(['security', 'set-keychain-settings', '-lut', '21600', str(keychain)])
    run_private(['security', 'unlock-keychain', '-p', password, str(keychain)])
    run_private(['security', 'import', str(p12), '-P', p12_password, '-t', 'cert', '-f', 'pkcs12',
                 '-k', str(keychain), '-T', '/usr/bin/codesign', '-T', '/usr/bin/security'])
    p12.unlink()
    run_private(['security', 'set-key-partition-list', '-S', 'apple-tool:,apple:,codesign:', '-k', password, str(keychain)])
    run_private(['security', 'list-keychains', '-d', 'user', '-s', str(keychain), *state['keychains']])
    identities = run_private(['security', 'find-identity', '-v', '-p', 'codesigning', str(keychain)]).decode()
    matches = re.findall(r'([A-Fa-f0-9]{40})\s+"(?:Apple Distribution|iPhone Distribution):[^"\n]+"', identities)
    if len(matches) != 1:
        raise ValueError('Exactly one valid Apple distribution identity is required')
    fingerprint = matches[0]
    profiles = {}
    profile_root = profile_directory()
    profile_root.mkdir(parents=True, exist_ok=True)
    print('校验三个分发描述文件。', flush=True)
    for target, (bundle, secret, entitlement_file) in TARGETS.items():
        file = directory / f'{target}.mobileprovision'
        decode_secret(secret, file)
        profile = plistlib.loads(run_private(['security', 'cms', '-D', '-i', str(file)]))
        expected = plistlib.loads((ROOT / 'ios' / entitlement_file).read_bytes())
        validate_profile(profile, bundle, expected, fingerprint)
        destination = profile_root / f"{profile['UUID']}.mobileprovision"
        if destination.exists():
            raise ValueError('Refusing to overwrite an existing provisioning profile')
        # Record cleanup before installing, so an interrupted copy is covered.
        state['profiles'].append(profile['UUID'])
        state_path.write_text(json.dumps(state))
        write_private(destination, file.read_bytes())
        file.unlink()
        profiles[bundle] = profile['UUID']
    source = json.loads(run_private(['xcodegen', 'dump', '--no-env', '--type', 'json', '--spec', str(ROOT / 'ios/project.yml')]))
    spec_path = directory / 'project.json'
    write_private(spec_path, json.dumps(release_spec(source, version, build, api, profiles, fingerprint)).encode())
    run_private(['xcodegen', 'generate', '--no-env', '--spec', str(spec_path),
                 '--project-root', str(ROOT / 'ios'), '--project', str(ROOT / 'ios')])
    write_private(directory / 'ExportOptions.plist', plistlib.dumps(export_options(profiles, fingerprint)))
    print('签名准备完成；由后续 Archive 和 Export IPA 步骤构建。')


def cleanup() -> None:
    directory = signing_directory()
    if not directory.exists():
        return
    state_path = directory / 'cleanup.json'
    errors = []
    if state_path.exists():
        state = json.loads(state_path.read_text())
        if (state_path.is_symlink() or set(state) != {'keychains', 'profiles'}
                or not all(isinstance(value, list) for value in state.values())
                or not all(isinstance(path, str) and Path(path).is_absolute() for path in state['keychains'])
                or not all(isinstance(uuid, str) and UUID_RE.fullmatch(uuid) for uuid in state['profiles'])):
            raise ValueError('Invalid cleanup state')
        commands = [['security', 'list-keychains', '-d', 'user', '-s', *state['keychains']]]
        if (directory / 'distribution.keychain-db').exists():
            commands.append(['security', 'delete-keychain', str(directory / 'distribution.keychain-db')])
        for command in commands:
            if subprocess.run(command, capture_output=True).returncode:
                errors.append('keychain')
        for uuid in state['profiles']:
            try:
                (profile_directory() / f'{uuid}.mobileprovision').unlink(missing_ok=True)
            except OSError:
                errors.append('profile')
    shutil.rmtree(directory)
    if errors:
        raise ValueError('Signing cleanup was incomplete; the disposable runner must be discarded')
    print('已清理临时签名材料。')


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=['validate', 'prepare', 'cleanup'])
    parser.add_argument('--version')
    parser.add_argument('--build-number')
    args = parser.parse_args()
    if args.action == 'cleanup':
        cleanup()
    else:
        if not args.version or not args.build_number:
            parser.error('--version and --build-number are required')
        if args.action == 'validate':
            validate_inputs(args.version, args.build_number, os.environ.get('BOJI_API_BASE_URL', ''))
        else:
            prepare(args.version, args.build_number)


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, subprocess.SubprocessError):
        print('签名准备或清理失败；检查版本、描述文件和 CI 配置。敏感输出未公开。', file=sys.stderr)
        sys.exit(1)
