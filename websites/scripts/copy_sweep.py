#!/usr/bin/env python3
"""全站文案检查：残留的 Pro、硬件比喻、方案/订阅、旧链接。用法：python3 scripts/copy_sweep.py"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FILES = [p for d in ("app", "components", "lib", "public") for p in (ROOT / d).rglob("*") if p.suffix in {".ts", ".tsx", ".json"}]
SKIP = {"app/calculator/page.tsx", "app/join/page.tsx"}  # 旧链接跳转页，本身就要写 /store/

# 只看引号内或 JSX 文本里的 Pro，排除组件名
PRO = re.compile(r"Pro(?![a-zA-Z])")
BANNED = re.compile(
    r"水冷|散热|快充|续航|神经引擎|机身|方案|订阅|薄肌 One|代价|从未如此|/calculator/|/join/|计算器|入会宣誓|立即入会|"
    r"proteinCan|proLifestyle|PLANS|CHIP_STATS|PRO_STATS"
)

hits = 0
for f in sorted(FILES):
    rel = f.relative_to(ROOT).as_posix()
    if rel in SKIP:
        continue
    for n, line in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
        if line.strip().startswith(("//", "/*", "*", "{/*")):
            continue  # 代码注释不算页面文案
        for kind, rx in (("Pro", PRO), ("banned", BANNED)):
            for m in rx.finditer(line):
                hits += 1
                print(f"[{kind}] {rel}:{n}: {line.strip()[:140]}")
print(f"total hits: {hits}")
sys.exit(1 if hits else 0)
