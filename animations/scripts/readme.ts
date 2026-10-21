// README images of the exercise animations, in both palettes: a still of the poster frame of every course
// exercise, and a looping GIF of every exercise in GIFS. The root README.md shows them.
// Usage: tsx scripts/readme.ts [--out <dir>]   (default: ../assets/public/previews)
// Deletes <out>/course/ and <out>/library/, then writes <out>/course/<palette>/<id>.png and .gif for course
// exercises and <out>/library/<palette>/<id>.gif for library exercises. The library images stay in their own
// directory, because the exercise library has a separate license.
// Reads lottie/ and lottie-library/. Run `pnpm build` first, because Git does not track lottie-library/.
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import gifenc from 'gifenc';
import type { IndexEntry } from '@/build/generate.ts';
import type { PaletteName } from '@/draw/palettes.ts';
import { LOTTIE_JS, launch } from './browser.ts';
import { THEMES } from './grid.ts';

/** Exercises with a GIF: one course exercise, then library exercises of different movement types and equipment. */
const GIFS = [
  'bodyweight-squat',
  'barbell-bench-press',
  'dumbbell-standing-lateral-raise',
  'cable-rope-seated-row',
  'barbell-romanian-deadlift',
  'kettlebell-goblet-squat',
  'ab-wheel-kneeling-rollout',
  'kettlebell-swing',
  'worlds-greatest-stretch',
];
/** Width and height of every image in pixels. The README shows the stills at half size. */
const SIZE = 240;
const GIF_FPS = 20;
/** Colors of a GIF palette. One more index marks the pixels that did not change since the previous frame. */
const COLORS = 127;

const root = path.resolve(import.meta.dirname, '..');
const { values } = parseArgs({ options: { out: { type: 'string' } } });
const outDir = path.resolve(values.out ?? path.join(root, '..', 'assets', 'public', 'previews'));

interface Source { entry: IndexEntry; base: string; group: 'course' | 'library' }
const sources = new Map<string, Source>();
for (const [dir, group] of [['lottie', 'course'], ['lottie-library', 'library']] as const) {
  const base = path.join(root, dir);
  const list = JSON.parse(fs.readFileSync(path.join(base, 'index.json'), 'utf8')) as IndexEntry[];
  for (const entry of list) sources.set(entry.id, { entry, base, group });
}
const courseIds = [...sources.values()].filter((s) => s.entry.course !== null).map((s) => s.entry.id);
const missing = GIFS.filter((id) => !sources.has(id));
if (missing.length) {
  console.error(`Unknown exercise IDs: ${missing.join(', ')}. Run pnpm build first.`);
  process.exit(2);
}

const browser = await launch();
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: 1 });
await page.setContent(`<html><body style="margin:0"><div id="c" style="width:${SIZE}px;height:${SIZE}px"></div></body></html>`);
await page.addScriptTag({ path: LOTTIE_JS });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(String(e)));

/** Loads an animation with the canvas renderer, so that its frames can be read as pixels. */
async function load(source: Source, theme: PaletteName): Promise<void> {
  const data: unknown = JSON.parse(fs.readFileSync(path.join(source.base, source.entry.files[theme]), 'utf8'));
  await page.evaluate((d) => {
    window.anim?.destroy();
    window.anim = window.lottie.loadAnimation({
      container: document.getElementById('c')!, renderer: 'canvas', loop: false, autoplay: false, animationData: d,
    });
  }, data);
}

/** Draws frame `f` of the loaded animation on `bg` and returns it as PNG data or as RGBA pixels. */
async function grab(f: number, bg: string, kind: 'png' | 'rgba'): Promise<Buffer> {
  const base64 = await page.evaluate(({ f, bg, kind }) => {
    window.anim!.goToAndStop(f, true);
    const src = document.querySelector<HTMLCanvasElement>('#c canvas')!;
    const out = document.createElement('canvas');
    out.width = src.width;
    out.height = src.height;
    const ctx = out.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(src, 0, 0);
    if (kind === 'png') return out.toDataURL('image/png').slice('data:image/png;base64,'.length);
    const px = ctx.getImageData(0, 0, out.width, out.height).data;
    let text = '';
    for (let i = 0; i < px.length; i += 0x8000) text += String.fromCharCode(...px.subarray(i, i + 0x8000));
    return btoa(text);
  }, { f, bg, kind });
  return Buffer.from(base64, 'base64');
}

/** Encodes looping RGBA frames with one global palette. Unchanged pixels become transparent, which keeps files small. */
function encodeGif(frames: Buffer[], delay: number): Uint8Array {
  const colors = gifenc.quantize(Buffer.concat(frames.filter((_, k) => k % 4 === 0)), COLORS);
  const unchanged = colors.length;
  const gif = gifenc.GIFEncoder();
  let prev: Uint8Array | undefined;
  for (const rgba of frames) {
    const index = gifenc.applyPalette(rgba, colors);
    if (prev === undefined) {
      gif.writeFrame(index, SIZE, SIZE, { palette: [...colors, [0, 0, 0]], delay, repeat: 0, dispose: 1 });
    } else {
      const last = prev;
      const diff = index.map((v, i) => (v === last[i] ? unchanged : v));
      gif.writeFrame(diff, SIZE, SIZE, { delay, transparent: true, transparentIndex: unchanged, dispose: 1 });
    }
    prev = index;
  }
  gif.finish();
  return gif.bytes();
}

const groups = ['course', 'library'] as const;
for (const group of groups) fs.rmSync(path.join(outDir, group), { recursive: true, force: true });
for (const theme of Object.keys(THEMES) as PaletteName[]) {
  for (const group of groups) fs.mkdirSync(path.join(outDir, group, theme), { recursive: true });
  const bg = THEMES[theme].bg;
  for (const id of courseIds) {
    const source = sources.get(id)!;
    await load(source, theme);
    fs.writeFileSync(path.join(outDir, 'course', theme, `${id}.png`), await grab(source.entry.posterFrame, bg, 'png'));
  }
  for (const id of GIFS) {
    const source = sources.get(id)!;
    await load(source, theme);
    const step = Math.max(1, Math.round(source.entry.fps / GIF_FPS));
    const frames: Buffer[] = [];
    for (let f = 0; f < source.entry.frames; f += step) frames.push(await grab(f, bg, 'rgba'));
    const file = path.join(outDir, source.group, theme, `${id}.gif`);
    fs.writeFileSync(file, encodeGif(frames, Math.round((1000 * step) / source.entry.fps)));
    console.log(`${path.relative(outDir, file)} ${(fs.statSync(file).size / 1024).toFixed(1)} KB, ${frames.length} frames`);
  }
  console.log(`${theme}: ${courseIds.length} stills and ${GIFS.length} GIFs in ${outDir}`);
}
await browser.close();
if (errors.length) {
  console.error('page errors:', errors);
  process.exitCode = 1;
}
