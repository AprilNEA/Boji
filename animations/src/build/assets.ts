// CLI: write only the asset catalog: every course exercise, bundled or not.
// Output: <out>/index.json and <out>/<palette>/<id>.json.
// Default <out>: ../assets/public/animations/exercises/v1, which the asset host serves at
// https://assets.leanmuscle.club/animations/exercises/v1/. Git tracks this output. `pnpm build` writes it too.
// Usage: tsx src/build/assets.ts [--out <dir>] [exerciseId...]
// Exercise IDs limit which animation files are rewritten; index.json always lists every course exercise.
// Exit code 1: IK or framing warnings. Exit code 2: bad arguments.
import path from 'node:path';
import { parseArgs } from 'node:util';
import { DEFAULT_CATALOG_DIR, generateCatalog } from './generate.ts';

try {
  const { values, positionals } = parseArgs({ options: { out: { type: 'string' } }, allowPositionals: true });
  const outDir = path.resolve(values.out ?? DEFAULT_CATALOG_DIR);
  const { warned } = generateCatalog(outDir, { only: positionals, log: (line) => console.log(line) });
  console.log(`Wrote ${outDir}`);
  if (warned) {
    console.error(`${warned} animation(s) have IK warnings.`);
    process.exitCode = 1;
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 2;
}
