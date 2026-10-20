// Render one contact sheet per palette: one row per exercise of lottie/ and lottie-library/, frames at
// 0, 25, 50 and 75 percent of the loop, then the poster frame with an outline.
// Rendering uses lottie-web in headless Chromium; no image tools are required.
// Usage: tsx scripts/sheet.ts [outDir]   (default: docs). Writes contact-sheet-<palette>.jpg.
import fs from 'node:fs';
import path from 'node:path';
import { readIndexes } from '../src/generate.ts';
import type { PaletteName } from '../src/palettes.ts';
import { LOTTIE_JS, launch } from './browser.ts';

const root = path.resolve(import.meta.dirname, '..');
const outDir = path.resolve(process.argv[2] ?? path.join(root, 'docs'));
const items = readIndexes(root);

const THEMES: Record<PaletteName, { bg: string; fg: string; muted: string }> = {
  light: { bg: '#F7F5F0', fg: '#1F1B16', muted: '#6B645B' },
  dark: { bg: '#1C1C1E', fg: '#F2EFEA', muted: '#A39E97' },
};
const STOPS = [0, 0.25, 0.5, 0.75];
const CELL = 200, LABEL = 170;

fs.mkdirSync(outDir, { recursive: true });
const browser = await launch();
for (const theme of Object.keys(THEMES) as PaletteName[]) {
  const c = THEMES[theme];
  const page = await browser.newPage({ viewport: { width: LABEL + CELL * (STOPS.length + 1), height: CELL }, deviceScaleFactor: 1 });
  const rows = items.map(({ entry: x }) => `
    <div class="row">
      <div class="label"><b>${x.name}</b><span>${x.id}</span></div>
      ${STOPS.map(() => '<div class="cell"></div>').join('')}
      <div class="cell poster"></div>
    </div>`).join('');
  await page.setContent(`<html><head><style>
    body { margin: 0; background: ${c.bg}; font-family: -apple-system, "PingFang SC", sans-serif; }
    .row { display: flex; height: ${CELL}px; }
    .label { width: ${LABEL - 20}px; padding: 18px 0 0 20px; display: flex; flex-direction: column; gap: 4px; }
    .label b { color: ${c.fg}; font-size: 16px; }
    .label span { color: ${c.muted}; font: 12px ui-monospace, Menlo, monospace; }
    .cell { width: ${CELL}px; height: ${CELL}px; box-sizing: border-box; }
    .poster { border: 2px dashed ${c.muted}; }
  </style></head><body>${rows}</body></html>`);
  await page.addScriptTag({ path: LOTTIE_JS });
  const files = items.map(({ entry, dir }) => fs.readFileSync(path.join(dir, entry.files[theme]), 'utf8'));
  const posters = items.map(({ entry }) => entry.posterFrame);
  await page.evaluate(({ files, stops, posters }) => {
    document.querySelectorAll('.row').forEach((row, i) => {
      row.querySelectorAll('.cell').forEach((cell, k) => {
        const anim = window.lottie.loadAnimation({ container: cell, renderer: 'svg', loop: false, autoplay: false, animationData: JSON.parse(files[i]!) });
        anim.goToAndStop(k < stops.length ? Math.round(stops[k]! * anim.totalFrames) : posters[i]!, true);
      });
    });
  }, { files, stops: STOPS, posters });
  const file = path.join(outDir, `contact-sheet-${theme}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 86, fullPage: true });
  await page.close();
  console.log(`${file}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
await browser.close();
