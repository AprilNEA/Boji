"""Download generated managed-storage images and composite them on Apple light gray for review.

Usage: python3 scripts/fetch_preview.py <storage-key> <out.png> [<storage-key> <out.png> ...]
"""
import io
import json
import os
import sys
import urllib.parse
import urllib.request

from PIL import Image

API = os.environ["MANUS_API_URL"].rstrip("/")
KEY = os.environ["MANUS_API_KEY"]


def signed_url(key: str) -> str:
    q = urllib.parse.urlencode({"path": key})
    req = urllib.request.Request(f"{API}/v1/storage/presign/get?{q}", headers={"Authorization": f"Bearer {KEY}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.load(r)
    if "url" not in data:
        raise RuntimeError(data.get("error", "no url"))
    return data["url"]


def main(args: list[str]) -> None:
    for key, out in zip(args[0::2], args[1::2]):
        with urllib.request.urlopen(signed_url(key), timeout=60) as r:
            raw = r.read()
        im = Image.open(io.BytesIO(raw))
        im.load()
        alpha = im.getchannel("A") if "A" in im.getbands() else None
        transparent = alpha is not None and alpha.getextrema()[0] < 10
        print(f"{key}: {im.size} {im.mode} {len(raw)} bytes transparent={transparent}")
        rgba = im.convert("RGBA")
        bg = Image.new("RGBA", rgba.size, (245, 245, 247, 255))
        bg.alpha_composite(rgba)
        bg.convert("RGB").save(out)


if __name__ == "__main__":
    main(sys.argv[1:])
