"""Install the pinned CLI inside the ignored workspace, without global changes."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import tempfile
import urllib.request

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent


def asset_info() -> tuple[str, str, dict]:
    lock = json.loads((HERE / "asc-lock.json").read_text(encoding="utf-8"))
    target = f"{platform.system()}-{platform.machine()}"
    if target not in lock["assets"]:
        raise ValueError(f"当前平台未配置 asc：{target}")
    asset = lock["assets"][target]
    prefix = "https://github.com/rorkai/App-Store-Connect-CLI/releases/download/"
    if not asset["url"].startswith(prefix + lock["version"] + "/"):
        raise ValueError("下载地址必须属于锁定的 GitHub 发布版本。")
    return lock["version"], target, asset


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def binary_path() -> Path:
    version, target, _ = asset_info()
    return ROOT / ".work" / "tools" / "asc" / version / target / "asc"


def verified_binary() -> Path:
    binary = binary_path()
    _, _, asset = asset_info()
    if not binary.is_file() or binary.is_symlink():
        raise ValueError("尚未安装 asc；先运行 python3 ios/app-store/manage.py install。")
    if sha256(binary) != asset["sha256"]:
        raise ValueError("asc 摘要不匹配；停止执行。检查文件后重新安装。")
    return binary


def install() -> Path:
    binary = binary_path()
    _, _, asset = asset_info()
    if binary.exists():
        return verified_binary()
    binary.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".download-", dir=binary.parent)
    temporary = Path(temporary)
    try:
        request = urllib.request.Request(asset["url"], headers={"User-Agent": "Boji-asc-setup"})
        with os.fdopen(fd, "wb") as target:
            with urllib.request.urlopen(request, timeout=90) as source:
                shutil.copyfileobj(source, target)
        if sha256(temporary) != asset["sha256"]:
            raise ValueError("下载文件摘要不匹配，未安装或执行。")
        temporary.chmod(0o755)
        os.replace(temporary, binary)
    finally:
        temporary.unlink(missing_ok=True)
    return verified_binary()


if __name__ == "__main__":
    print(install())
