"""Keep full build logs and dSYMs encrypted; publish only safe diagnostics."""
from __future__ import annotations

import argparse
import io
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile

FINGERPRINT_NAME = 'recipient-fingerprint'
CIPHERTEXT_NAME = 'release-evidence.tar.gpg'
FORBIDDEN_SUFFIXES = ('.ipa', '.mobileprovision', '.p12', '.pfx', '.p8', '.key')
FINGERPRINT = re.compile(r'[0-9A-F]{40}(?:[0-9A-F]{24})?')
DIAGNOSTIC = re.compile(rb'(?:[^\r\n]*[/\\])?([A-Za-z0-9_.-]{1,255}\.swift):([0-9]{1,9}):([0-9]{1,9}): (error|warning):')


class ArtifactError(Exception):
    """A non-sensitive validation error."""


def gpg(home: Path, *arguments: str, data: bytes | None = None) -> bytes:
    # Public-key encryption needs no agent, private key or user configuration.
    result = subprocess.run(['gpg', '--no-options', '--homedir', str(home), '--batch',
                             '--no-autostart', '--no-auto-key-retrieve', *arguments],
                            input=data, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    if result.returncode:
        raise ArtifactError('GPG operation failed; check the encryption public key.')
    return result.stdout


def primary_fingerprint(data: bytes) -> str:
    records = [line.split(':') for line in data.decode('ascii', 'replace').splitlines()]
    if sum(record[0] == 'pub' for record in records) != 1:
        raise ArtifactError('Exactly one public key is required.')
    if any(record[0] in ('sec', 'ssb') for record in records):
        raise ArtifactError('Private keys are not allowed.')
    for index, record in enumerate(records):
        if record[0] == 'pub' and index + 1 < len(records):
            following = records[index + 1]
            if len(following) > 9 and following[0] == 'fpr' and FINGERPRINT.fullmatch(following[9]):
                return following[9]
    raise ArtifactError('Missing public key fingerprint.')


def require_directory(path: Path) -> None:
    if path.is_symlink() or not path.is_dir():
        raise ArtifactError('A regular directory is required.')


def private_file(path: Path, *, exclusive: bool = True):
    if path.is_symlink() or (path.exists() and not stat.S_ISREG(path.stat().st_mode)):
        raise ArtifactError('A private output must be a regular file.')
    flags = os.O_WRONLY | os.O_CREAT | (os.O_EXCL if exclusive else os.O_TRUNC)
    flags |= getattr(os, 'O_NOFOLLOW', 0)
    descriptor = os.open(path, flags, 0o600)
    os.fchmod(descriptor, 0o600)
    return os.fdopen(descriptor, 'wb')


def encrypt(home: Path, fingerprint: str, output: Path, source: Path | None = None) -> None:
    args = ['--yes', '--trust-model', 'always', '--recipient', fingerprint,
            '--output', str(output), '--encrypt']
    if source is not None:
        args.append(str(source))
    gpg(home, *args, data=b'' if source is None else None)
    if not output.is_file() or output.stat().st_size == 0:
        raise ArtifactError('Encryption produced no output.')
    output.chmod(0o600)


def prepare(directory: Path) -> None:
    value = os.environ.get('IOS_ARTIFACT_PUBLIC_KEY', '').strip()
    if (not value.startswith('-----BEGIN PGP PUBLIC KEY BLOCK-----')
            or not value.endswith('-----END PGP PUBLIC KEY BLOCK-----')
            or value.count('-----BEGIN') != 1 or 'PRIVATE KEY' in value):
        raise ArtifactError('Provide a single armored encryption public key, never a private key.')
    try:
        public_key = value.encode('ascii')
    except UnicodeError as error:
        raise ArtifactError('The public key must be ASCII armored.') from error
    if directory.exists() or directory.is_symlink():
        raise ArtifactError('Use a new evidence directory.')
    # Validate before publishing a prepared workspace. No user keyring is touched.
    with tempfile.TemporaryDirectory(prefix='boji-evidence-') as temporary:
        prepared = Path(temporary) / 'prepared'
        home = prepared / 'gnupg'
        prepared.mkdir(mode=0o700)
        home.mkdir(mode=0o700)
        fingerprint = primary_fingerprint(gpg(home, '--with-colons', '--import-options', 'show-only',
                                              '--import', data=public_key))
        gpg(home, '--import', data=public_key)
        if primary_fingerprint(gpg(home, '--with-colons', '--list-keys')) != fingerprint:
            raise ArtifactError('Unexpected imported key.')
        probe = prepared / 'probe.gpg'
        encrypt(home, fingerprint, probe)
        probe.unlink()
        (prepared / 'logs').mkdir(mode=0o700)
        with private_file(prepared / FINGERPRINT_NAME) as handle:
            handle.write((fingerprint + '\n').encode('ascii'))
        directory.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(prepared), str(directory))


def log_stream(path: Path, stream) -> None:
    require_directory(path.parent)
    with private_file(path, exclusive=False) as handle:
        while line := stream.readline(64 * 1024 + 1):
            handle.write(line)
            # Never print diagnostic bodies, paths, URLs, credentials or tool output.
            match = DIAGNOSTIC.match(line)
            if match:
                source, row, column, kind = (part.decode('ascii') for part in match.groups())
                print(f'{source}:{row}:{column}: {kind}', flush=True)
            elif line.strip() in (b'** BUILD FAILED **', b'** ARCHIVE FAILED **', b'** EXPORT FAILED **'):
                print('构建阶段失败。请查看受保护日志。', flush=True)


def safe_member(info: tarfile.TarInfo) -> tarfile.TarInfo:
    if not (info.isdir() or info.isreg()):
        raise ArtifactError('Links and special files are not allowed in evidence.')
    if info.name.lower().endswith(FORBIDDEN_SUFFIXES):
        raise ArtifactError('Do not archive apps or signing credentials as diagnostics.')
    info.uid = info.gid = info.mtime = 0
    info.uname = info.gname = ''
    info.mode = 0o700 if info.isdir() else 0o600
    return info


def manifest() -> bytes:
    public = {}
    for variable, key, pattern in [('GITHUB_SHA', 'commit', r'[0-9a-f]{40}'),
                                   ('GITHUB_RUN_ID', 'run_id', r'[0-9]{1,20}'),
                                   ('GITHUB_RUN_ATTEMPT', 'run_attempt', r'[0-9]{1,20}')]:
        value = os.environ.get(variable, '')
        if re.fullmatch(pattern, value):
            public[key] = value
    return json.dumps({'github': public}, sort_keys=True).encode('utf-8')


def seal(directory: Path, archive: Path, receipt: Path, output: Path) -> None:
    require_directory(directory)
    require_directory(directory / 'logs')
    home = directory / 'gnupg'
    require_directory(home)
    recipient = directory / FINGERPRINT_NAME
    if recipient.is_symlink() or not recipient.is_file():
        raise ArtifactError('Missing prepared recipient.')
    fingerprint = recipient.read_text(encoding='ascii').strip()
    if (not FINGERPRINT.fullmatch(fingerprint)
            or primary_fingerprint(gpg(home, '--with-colons', '--list-keys')) != fingerprint):
        raise ArtifactError('The prepared recipient changed.')
    if output.is_symlink() or (output.exists() and (not output.is_dir() or any(output.iterdir()))):
        raise ArtifactError('The encrypted output directory must be empty.')
    output.mkdir(mode=0o700, parents=True, exist_ok=True)
    pending = output / '.evidence.pending'
    try:
        with tempfile.TemporaryDirectory(prefix='seal-', dir=directory) as temporary:
            plaintext = Path(temporary) / 'evidence.tar'
            with private_file(plaintext) as handle, tarfile.open(fileobj=handle, mode='w') as bundle:
                bundle.add(directory / 'logs', arcname='logs', filter=safe_member)
                if archive.exists() or archive.is_symlink():
                    require_directory(archive)
                    dsyms = archive / 'dSYMs'
                    if dsyms.exists() or dsyms.is_symlink():
                        require_directory(dsyms)
                        bundle.add(dsyms, arcname='dSYMs', filter=safe_member)
                if receipt.exists() or receipt.is_symlink():
                    if receipt.is_symlink() or not receipt.is_file():
                        raise ArtifactError('The receipt must be a regular file.')
                    bundle.add(receipt, arcname='receipt/receipt.json', filter=safe_member)
                data = manifest()
                info = tarfile.TarInfo('manifest.json')
                info.size, info.mode = len(data), 0o600
                bundle.addfile(info, io.BytesIO(data))
            encrypt(home, fingerprint, pending, plaintext)
        # Publish only after plaintext cleanup succeeds; never upload partial output.
        os.replace(pending, output / CIPHERTEXT_NAME)
    finally:
        pending.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest='command', required=True)
    prepare_command = commands.add_parser('prepare')
    prepare_command.add_argument('--directory', type=Path, required=True)
    log_command = commands.add_parser('log')
    log_command.add_argument('--file', type=Path, required=True)
    seal_command = commands.add_parser('seal')
    for name in ('directory', 'archive', 'receipt', 'output'):
        seal_command.add_argument('--' + name, type=Path, required=True)
    args = parser.parse_args()
    if args.command == 'prepare':
        prepare(args.directory)
        print('已准备诊断加密公钥。')
    elif args.command == 'log':
        log_stream(args.file, sys.stdin.buffer)
    else:
        seal(args.directory, args.archive, args.receipt, args.output)
        print('已封存加密诊断产物。')


if __name__ == '__main__':
    try:
        main()
    except (ArtifactError, OSError, UnicodeError, tarfile.TarError):
        print('诊断处理失败；检查加密公钥、文件范围和权限。原始内容未公开。', file=sys.stderr)
        sys.exit(1)
