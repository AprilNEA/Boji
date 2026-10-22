// Build the offline preview: preview/data.js embeds every course animation of the asset catalog and the named library exercises of
// lottie-library/. The full library is too large for one page. preview/lottie.min.js is copied from node_modules.
// Both files are git-ignored. Open preview/index.html afterwards.
// Usage: tsx scripts/preview.ts [<library exercise id>...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { DEFAULT_CATALOG_DIR, readIndex, readIndexes } from '@/build/generate.ts';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.join(root, 'preview');

const { positionals: libraryIds } = parseArgs({ allowPositionals: true, options: {} });
const wanted = new Set(libraryIds);
const library = readIndexes(root, ['lottie-library']).filter(({ entry }) => wanted.has(entry.id));
const missing = libraryIds.filter((id) => !library.some(({ entry }) => entry.id === id));
if (missing.length) {
  console.error(`not in lottie-library/index.json (run pnpm build first): ${missing.join(', ')}`);
  process.exit(2);
}
const items = [...readIndex(DEFAULT_CATALOG_DIR), ...library];
const index = items.map(({ entry }) => entry);
const data: Record<string, Record<string, unknown>> = {};
for (const { entry, dir } of items) {
  for (const [theme, file] of Object.entries(entry.files)) {
    (data[theme] ??= {})[entry.id] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  }
}
fs.writeFileSync(path.join(outDir, 'data.js'), `window.BOJI_ANIMATIONS = ${JSON.stringify({ index, data })};\n`);
fs.copyFileSync(fileURLToPath(import.meta.resolve('lottie-web/build/player/lottie.min.js')), path.join(outDir, 'lottie.min.js'));
console.log(pathToFileURL(path.join(outDir, 'index.html')).href);
