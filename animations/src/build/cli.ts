// CLI: write lottie/ (exercises of bundled courses), lottie-library/ (exercises that no course uses) and the
// asset catalog (every course exercise). Each directory gets <palette>/<id>.json for every exercise and
// palette, plus index.json.
// Usage: tsx src/build/cli.ts [--out <dir>] [--catalog <dir>] [exerciseId...]
// --out is the base directory of lottie/ and lottie-library/ and defaults to animations/. --catalog defaults to
// assets/public/animations/exercises/v1, or to <out>/catalog when --out is given. Exercise IDs limit which
// animation files are rewritten; index.json always lists every exercise of its directory. Files of exercises
// that left a directory are deleted. Exit code 1: IK or framing warnings. Exit code 2: bad arguments.
import path from 'node:path';
import { parseArgs } from 'node:util';
import { DEFAULT_CATALOG_DIR, generate } from './generate.ts';
try {
  const { values, positionals } = parseArgs({
    options: { out: { type: 'string' }, catalog: { type: 'string' } }, allowPositionals: true,
  });
  const baseDir = path.resolve(values.out ?? path.join(import.meta.dirname, '../..'));
  const catalogDir = path.resolve(values.catalog ?? (values.out ? path.join(baseDir, 'catalog') : DEFAULT_CATALOG_DIR));
  const { warned } = generate(baseDir, catalogDir, { only: positionals, log: (line) => console.log(line) });
  if (warned) {
    console.error(`${warned} animation(s) have IK warnings.`);
    process.exitCode = 1;
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 2;
}
