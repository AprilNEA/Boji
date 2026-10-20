// Build the offline preview: preview/data.js embeds every animation, preview/lottie.min.js is copied
// from node_modules. Both files are git-ignored. Open preview/index.html afterwards.
// Usage: tsx scripts/preview.ts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { IndexEntry } from '../src/generate.ts';

const root = path.resolve(import.meta.dirname, '..');
const lottieDir = path.join(root, 'lottie');
const outDir = path.join(root, 'preview');

const index = JSON.parse(fs.readFileSync(path.join(lottieDir, 'index.json'), 'utf8')) as IndexEntry[];
const data: Record<string, Record<string, unknown>> = {};
for (const x of index) {
  for (const [theme, file] of Object.entries(x.files)) {
    (data[theme] ??= {})[x.id] = JSON.parse(fs.readFileSync(path.join(lottieDir, file), 'utf8'));
  }
}
fs.writeFileSync(path.join(outDir, 'data.js'), `window.BOJI_ANIMATIONS = ${JSON.stringify({ index, data })};\n`);
fs.copyFileSync(fileURLToPath(import.meta.resolve('lottie-web/build/player/lottie.min.js')), path.join(outDir, 'lottie.min.js'));
console.log(pathToFileURL(path.join(outDir, 'index.html')).href);
