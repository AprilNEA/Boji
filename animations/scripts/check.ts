// Verify that lottie/ and the asset catalog (assets/public/animations/exercises/v1) match a fresh generator run.
// Fails when files differ, are missing or are extra, or when the generator reports warnings for any exercise,
// course or library. Run before committing; `devenv test` runs it too. Git ignores lottie-library/, so this
// script does not compare it.
// Usage: tsx scripts/check.ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DEFAULT_CATALOG_DIR, generate } from '@/build/generate.ts';

const root = path.resolve(import.meta.dirname, '..');
const fresh = fs.mkdtempSync(path.join(os.tmpdir(), 'boji-lottie-'));

const list = (dir: string): string[] => fs.readdirSync(dir, { recursive: true, encoding: 'utf8' })
  .filter((f) => fs.statSync(path.join(dir, f)).isFile())
  .map((f) => f.split(path.sep).join('/'))
  .sort();

let outOfDate = false;
let warnedCount = 0;
try {
  const { warned } = generate(fresh, path.join(fresh, 'catalog'));
  warnedCount = warned;
  if (warned) console.error(`${warned} animation(s) have IK warnings.`);
  const sets = [
    { name: 'lottie', committed: path.join(root, 'lottie'), produced: path.join(fresh, 'lottie') },
    { name: path.relative(root, DEFAULT_CATALOG_DIR), committed: DEFAULT_CATALOG_DIR, produced: path.join(fresh, 'catalog') },
  ];
  for (const { name: set, committed, produced } of sets) {
    const a = new Set(fs.existsSync(committed) ? list(committed) : []);
    const b = new Set(list(produced));
    let setFailed = false;
    for (const f of new Set([...a, ...b])) {
      if (!a.has(f)) { console.error(`missing in ${set}/: ${f}`); setFailed = true; continue; }
      if (!b.has(f)) { console.error(`not produced by the generator: ${set}/${f}`); setFailed = true; continue; }
      if (!fs.readFileSync(path.join(committed, f)).equals(fs.readFileSync(path.join(produced, f)))) {
        console.error(`out of date: ${set}/${f}`);
        setFailed = true;
      }
    }
    if (setFailed) outOfDate = true;
    else console.log(`${set}/ is up to date (${a.size} files).`);
  }
} finally {
  fs.rmSync(fresh, { recursive: true, force: true });
}
if (outOfDate) console.error('Generated animations are out of date. Run `pnpm build` and commit the result.');
if (warnedCount) console.error('Fix the poses with IK warnings: run `pnpm build` and read the WARN lines.');
if (outOfDate || warnedCount) process.exitCode = 1;
