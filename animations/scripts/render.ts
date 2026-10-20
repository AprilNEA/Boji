// Render Lottie files to PNG frames with lottie-web in headless Chromium.
// Usage: tsx scripts/render.ts <out-dir> <frames-per-file> <bg-hex> <file.json>...
// FRAMES=0,90 renders explicit frame numbers instead of evenly spaced ones.
import fs from 'node:fs';
import path from 'node:path';
import { LOTTIE_JS, launch } from './browser.ts';

const [outDir, countArg, bg = '#F7F5F0', ...files] = process.argv.slice(2);
if (!outDir || !files.length) {
  console.error('Usage: tsx scripts/render.ts <out-dir> <frames-per-file> <bg-hex> <file.json>...');
  process.exit(2);
}
const count = Number(countArg ?? 8);
fs.mkdirSync(outDir, { recursive: true });

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
await page.setContent(`<html><body style="margin:0;background:${bg}"><div id="c" style="width:512px;height:512px"></div></body></html>`);
await page.addScriptTag({ path: LOTTIE_JS });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(String(e)));

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8')) as { op: number };
  await page.evaluate((d) => {
    window.anim?.destroy();
    window.anim = window.lottie.loadAnimation({ container: document.getElementById('c')!, renderer: 'svg', loop: false, autoplay: false, animationData: d });
  }, data);
  const name = path.basename(file, '.json');
  const list = process.env.FRAMES ? process.env.FRAMES.split(',').map(Number) : Array.from({ length: count }, (_, i) => Math.round((i * data.op) / count));
  for (const f of list) {
    await page.evaluate((fr) => window.anim!.goToAndStop(fr, true), f);
    await page.locator('#c').screenshot({ path: path.join(outDir, `${name}-${String(f).padStart(4, '0')}.png`) });
  }
}
await browser.close();
if (errors.length) {
  console.error('page errors:', errors);
  process.exitCode = 1;
}
console.log('rendered', files.length, 'files');
