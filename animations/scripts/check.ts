// Verify that lottie/ and lottie-library/ match a fresh generator run. Fails when files differ, are missing
// or are extra, or when the generator reports warnings. Run before committing; `devenv test` runs it too.
// Usage: tsx scripts/check.ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { generate, SET_DIRS } from '../src/generate.ts';

const root = path.resolve(import.meta.dirname, '..');
const fresh = fs.mkdtempSync(path.join(os.tmpdir(), 'boji-lottie-'));

const list = (dir: string): string[] => fs.readdirSync(dir, { recursive: true, encoding: 'utf8' })
  .filter((f) => fs.statSync(path.join(dir, f)).isFile())
  .map((f) => f.split(path.sep).join('/'))
  .sort();

let failed = false;
try {
  const { warned } = generate(fresh);
  if (warned) {
    console.error(`${warned} animation(s) have IK warnings.`);
    failed = true;
  }
  for (const set of SET_DIRS) {
    const committed = path.join(root, set);
    const a = new Set(fs.existsSync(committed) ? list(committed) : []);
    const b = new Set(list(path.join(fresh, set)));
    let setFailed = false;
    for (const f of new Set([...a, ...b])) {
      if (!a.has(f)) { console.error(`missing in ${set}/: ${f}`); setFailed = true; continue; }
      if (!b.has(f)) { console.error(`not produced by the generator: ${set}/${f}`); setFailed = true; continue; }
      if (!fs.readFileSync(path.join(committed, f)).equals(fs.readFileSync(path.join(fresh, set, f)))) {
        console.error(`out of date: ${set}/${f}`);
        setFailed = true;
      }
    }
    if (setFailed) failed = true;
    else console.log(`${set}/ is up to date (${a.size} files).`);
  }
} finally {
  fs.rmSync(fresh, { recursive: true, force: true });
}
if (failed) {
  console.error('Generated animations are out of date. Run `pnpm build` and commit the result.');
  process.exitCode = 1;
}
