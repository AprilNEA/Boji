"""Install the pinned generator without modifying global tools."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import stat
import subprocess
import tempfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]


def toolchain() -> dict:
    return json.loads((ROOT / 'ios/ci/toolchain.json').read_text())


def install_xcodegen() -> Path:
    info = toolchain()['xcodegen']
    expected = f"https://github.com/yonaskolb/XcodeGen/releases/download/{info['version']}/xcodegen.zip"
    if info['url'] != expected:
        raise ValueError('XcodeGen source is not the pinned upstream release')
    target = ROOT / '.work/tools/xcodegen' / info['version']
    target.mkdir(parents=True, exist_ok=True)
    archive = target / 'xcodegen.zip'
    if not archive.is_file():
        with tempfile.NamedTemporaryFile(dir=target, delete=False) as file:
            temporary = Path(file.name)
            try:
                with urllib.request.urlopen(info['url'], timeout=120) as response:
                    file.write(response.read())
            except BaseException:
                temporary.unlink(missing_ok=True)
                raise
        temporary.replace(archive)
    if hashlib.sha256(archive.read_bytes()).hexdigest() != info['sha256']:
        raise ValueError('XcodeGen archive checksum mismatch')
    # The generator also requires its adjacent share/xcodegen/SettingPresets tree.
    with zipfile.ZipFile(archive) as source:
        if 'xcodegen/bin/xcodegen' not in source.namelist():
            raise ValueError('Unexpected XcodeGen archive layout')
        for item in source.infolist():
            name = PurePosixPath(item.filename)
            if name.is_absolute() or '..' in name.parts or stat.S_ISLNK(item.external_attr >> 16):
                raise ValueError('Unsafe XcodeGen archive member')
            if item.is_dir():
                continue
            if item.filename not in ('xcodegen/bin/xcodegen', 'xcodegen/LICENSE') and not item.filename.startswith('xcodegen/share/xcodegen/SettingPresets/'):
                continue
            destination = target.joinpath(*name.parts[1:])
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(source.read(item))
        binary = target / 'bin/xcodegen'
        if not (target / 'share/xcodegen/SettingPresets/base.yml').is_file():
            raise ValueError('XcodeGen build setting presets are missing')
    binary.chmod(0o755)
    result = subprocess.check_output([str(binary), '--version'], text=True).strip()
    if result != f"Version: {info['version']}":
        raise ValueError('Unexpected XcodeGen version')
    return binary


def main() -> None:
    binary = install_xcodegen()
    if os.environ.get('GITHUB_PATH'):
        with open(os.environ['GITHUB_PATH'], 'a') as stream:
            stream.write(str(binary.parent) + '\n')
    print(binary)


if __name__ == '__main__':
    main()
