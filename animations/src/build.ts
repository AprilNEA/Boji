// CLI: write lottie/<palette>/<id>.json for every exercise and palette, plus lottie/index.json.
// Usage: tsx src/build.ts [--out <dir>] [exerciseId...]
// --out defaults to ../lottie. Exercise IDs limit which animation files are rewritten;
// index.json always lists every exercise. Exit code 1: IK or framing warnings. Exit code 2: bad arguments.
import path from 'node:path';
import { parseArgs } from 'node:util';
import { generate } from './generate.ts';

try {
  const { values, positionals } = parseArgs({ options: { out: { type: 'string' } }, allowPositionals: true });
  const outDir = path.resolve(values.out ?? path.join(import.meta.dirname, '..', 'lottie'));
  const { warned } = generate(outDir, { only: positionals, log: (line) => console.log(line) });
  if (warned) {
    console.error(`${warned} animation(s) have IK warnings.`);
    process.exitCode = 1;
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 2;
}
