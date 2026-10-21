// CLI: write lottie/ (course exercises) and lottie-library/ (library exercises). Each directory gets
// <palette>/<id>.json for every exercise and palette, plus index.json.
// Usage: tsx src/build/cli.ts [--out <dir>] [exerciseId...]
// --out is the base directory and defaults to animations/. Exercise IDs limit which animation files are
// rewritten; index.json always lists every exercise of its directory. Files of exercises that moved to the
// other directory are deleted. Exit code 1: IK or framing warnings. Exit code 2: bad arguments.
import path from 'node:path';
import { parseArgs } from 'node:util';
import { generate } from './generate.ts';

try {
  const { values, positionals } = parseArgs({ options: { out: { type: 'string' } }, allowPositionals: true });
  const baseDir = path.resolve(values.out ?? path.join(import.meta.dirname, '../..'));
  const { warned } = generate(baseDir, { only: positionals, log: (line) => console.log(line) });
  if (warned) {
    console.error(`${warned} animation(s) have IK warnings.`);
    process.exitCode = 1;
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 2;
}
