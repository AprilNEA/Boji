// Render one contact sheet per palette: one row per course exercise in the asset catalog, frames at
// 0, 25, 50 and 75 percent of the loop, then the poster frame with an outline. Review library exercises with
// scripts/family.ts, which renders one family at a time.
// Rendering uses lottie-web in headless Chromium; no image tools are required.
// Usage: tsx scripts/sheet.ts [outDir]   (default: docs). Writes contact-sheet-<palette>.jpg.
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_CATALOG_DIR, readIndex } from '@/build/generate.ts';
import type { PaletteName } from '@/draw/palettes.ts';
import { launch } from './browser.ts';
import { renderGrid, THEMES } from './grid.ts';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.resolve(process.argv[2] ?? path.join(root, 'docs'));
const items = readIndex(DEFAULT_CATALOG_DIR);
const STOPS = [0, 0.25, 0.5, 0.75];

fs.mkdirSync(outDir, { recursive: true });
const browser = await launch();
for (const theme of Object.keys(THEMES) as PaletteName[]) {
  const rows = items.map(({ entry, dir }) => ({
    title: entry.name,
    sub: entry.id,
    json: fs.readFileSync(path.join(dir, entry.files[theme]), 'utf8'),
    frames: [...STOPS.map((s) => Math.round(s * entry.frames)), entry.posterFrame],
    marked: [STOPS.length],
  }));
  const file = path.join(outDir, `contact-sheet-${theme}.jpg`);
  await renderGrid(browser, rows, file, { theme });
  console.log(`${file}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
await browser.close();
