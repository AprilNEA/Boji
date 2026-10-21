// Develop one library family: type-check it, validate its metadata, generate both palettes and render review
// sheets. It imports only this family, so other families that are being edited at the same time do not matter.
// Usage: node --import tsx scripts/family.ts <family> [--out <dir>] [--dark] [--no-sheet] [--worklist <json>] [<id>...]
//   <id>...     only these exercises (default: all files of the family). Only their files, and the helper files they
//               import, are type-checked and imported, so unfinished files of other authors in the same directory
//               do not cause errors.
//   --worklist  add the IDs of a work list (JSON array, or { items: [...] }, of objects with `id`) whose files exist
//   --out       output directory (default: .renders/family/<family>)
//   --dark      also render the dark sheet (the dark JSON is always generated)
//   --no-sheet  skip rendering; still type-checks, validates and generates
// Writes <out>/{light,dark}/<id>.json and <out>/sheet-<palette>-<page>.jpg: 10 exercises per page, frames at
// 0, 1/6, ... 5/6 of the loop, then the poster frame with a dashed outline. Exit code 1 on any error.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { compose } from '@/compose/index.ts';
import type { Exercise } from '@/exercise.ts';
import { posterFrame } from '@/build/poster.ts';
import { loadFamily } from '@/exercises/library/load.ts';
import type { PaletteName } from '@/draw/palettes.ts';
import { launch } from './browser.ts';
import { renderGrid, type GridRow } from './grid.ts';

const root = path.resolve(import.meta.dirname, '..');
const USAGE = 'usage: node --import tsx scripts/family.ts <family> [--out <dir>] [--dark] [--no-sheet] [--worklist <json>] [<id>...]';
const parseCli = () => parseArgs({
  allowPositionals: true,
  options: { out: { type: 'string' }, dark: { type: 'boolean' }, 'no-sheet': { type: 'boolean' }, worklist: { type: 'string' } },
});
let cli: ReturnType<typeof parseCli>;
try { cli = parseCli(); } catch (e) { console.error(`${(e as Error).message}\n${USAGE}`); process.exit(2); }
const dark = cli.values.dark ?? false, noSheet = cli.values['no-sheet'] ?? false;
const outArg = cli.values.out;
const worklist = cli.values.worklist;
const [family, ...only] = cli.positionals;
if (!family) {
  console.error(USAGE);
  process.exit(2);
}
const famDir = path.join(root, 'src/exercises/library', family);
if (!fs.existsSync(famDir)) { console.error(`no such family directory: ${path.relative(root, famDir)}`); process.exit(2); }
if (worklist) {
  const data = JSON.parse(fs.readFileSync(worklist, 'utf8')) as { id: string }[] | { items: { id: string }[] };
  const items = Array.isArray(data) ? data : data.items;
  for (const { id } of items) if (fs.existsSync(path.join(famDir, `${id}.ts`)) && !only.includes(id)) only.push(id);
  if (!only.length) { console.error(`no file of ${worklist} exists in ${path.relative(root, famDir)} yet`); process.exit(2); }
}
const out = path.resolve(outArg ?? path.join(root, '.renders/family', family));
fs.mkdirSync(out, { recursive: true });
let errors = 0;
const fail = (msg: string): void => { errors++; console.error(`ERROR ${msg}`); };

// 1. Type-check only this family and the shared code it imports.
const tsconfig = path.join(out, 'tsconfig.json');
// Type roots resolve relative to the config file, and `out` may be outside the project.
fs.writeFileSync(tsconfig, JSON.stringify({
  extends: path.join(root, 'tsconfig.json'),
  compilerOptions: { typeRoots: [path.join(root, 'node_modules/@types')] },
  include: only.length ? only.map((id) => path.join(famDir, `${id}.ts`)) : [path.join(famDir, '**/*.ts')],
}, null, 2));
try {
  execFileSync(path.join(root, 'node_modules/.bin/tsc'), ['-p', tsconfig, '--pretty', 'false'], { stdio: 'pipe' });
  console.log('typecheck: ok');
} catch (e) {
  const text = String((e as { stdout?: Buffer }).stdout ?? e);
  for (const line of text.trim().split('\n')) fail(`tsc ${line.replace(root + '/', '')}`);
}

// 2. Load and validate. IDs must be unique across the whole repository: compare with the file names of the
// other families and of src/exercises/course, without importing them.
let exercises: Exercise[] = [];
try { exercises = await loadFamily(family, only); } catch (e) { fail(String((e as Error).message)); }
const taken = new Map<string, string>();
for (const f of fs.readdirSync(path.join(root, 'src/exercises/course'))) if (f.endsWith('.ts')) taken.set(f.slice(0, -3), 'src/exercises/course');
for (const d of fs.readdirSync(path.join(root, 'src/exercises/library'), { withFileTypes: true })) {
  if (!d.isDirectory() || d.name === family) continue;
  for (const f of fs.readdirSync(path.join(root, 'src/exercises/library', d.name))) if (f.endsWith('.ts') && !f.startsWith('_')) taken.set(f.slice(0, -3), `library/${d.name}`);
}
if (only.length) for (const f of fs.readdirSync(famDir)) if (f.endsWith('.ts') && !f.startsWith('_') && !only.includes(f.slice(0, -3))) taken.set(f.slice(0, -3), `library/${family} (another file)`);
for (const ex of exercises) {
  const where = taken.get(ex.id);
  if (where) fail(`${ex.id}: id already used in ${where}`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ex.id)) fail(`${ex.id}: id must be lowercase kebab-case`);
  if (!/[\u4e00-\u9fff]/.test(ex.name)) fail(`${ex.id}: name must be Chinese`);
  if (!ex.meta) { fail(`${ex.id}: meta is required`); continue; }
  if (!ex.meta.en) fail(`${ex.id}: meta.en is empty`);
  if (!ex.meta.equipment.length) fail(`${ex.id}: meta.equipment is empty`);
  if (!ex.meta.sources.length || ex.meta.sources.some((s) => !/^(fe|hz):\S+$/.test(s))) fail(`${ex.id}: meta.sources must be fe:<id> or hz:<id>`);
  if (!ex.muscles?.length) fail(`${ex.id}: no highlighted muscles`);
}
const selected = exercises;

// 3. Generate both palettes and report.
const themes: PaletteName[] = ['light', 'dark'];
const json: Record<PaletteName, Map<string, string>> = { light: new Map(), dark: new Map() };
const posters = new Map<string, number>();
for (const ex of selected) {
  for (const theme of themes) {
    try {
      const c = compose(ex, theme);
      const text = JSON.stringify(c.anim);
      json[theme].set(ex.id, text);
      fs.mkdirSync(path.join(out, theme), { recursive: true });
      fs.writeFileSync(path.join(out, theme, `${ex.id}.json`), text);
      if (theme === 'light') {
        posters.set(ex.id, posterFrame(ex, c.frames));
        console.log(`${ex.id.padEnd(40)} ${String(c.frames).padStart(4)} frames  poster ${String(posters.get(ex.id)).padStart(4)}  ${(text.length / 1024).toFixed(0).padStart(4)} KB  zoom ${c.zoom.toFixed(2)}  warnings ${c.warnings.length}`);
        for (const w of c.warnings) console.warn(`  WARN ${w}`);
      }
    } catch (e) {
      fail(`${ex.id} (${theme}): ${(e as Error).stack ?? e}`);
    }
  }
}

// 4. Review sheets.
if (!noSheet && json.light.size) {
  const browser = await launch();
  const ids = [...json.light.keys()];
  for (const theme of dark ? themes : (['light'] as PaletteName[])) {
    for (let page = 0; page * 10 < ids.length; page++) {
      const rows: GridRow[] = ids.slice(page * 10, page * 10 + 10).map((id) => {
        const ex = selected.find((e) => e.id === id)!;
        const text = json[theme].get(id)!;
        const frames = (JSON.parse(text) as { op: number }).op;
        return {
          title: ex.name, sub: id, json: text,
          frames: [...[0, 1, 2, 3, 4, 5].map((k) => Math.round((k * frames) / 6)), posters.get(id)!],
          marked: [6],
        };
      });
      const file = path.join(out, `sheet-${theme}-${page + 1}.jpg`);
      await renderGrid(browser, rows, file, { theme, cell: 190, label: 200 });
      console.log(`sheet: ${file}`);
    }
  }
  await browser.close();
}
console.log(`${selected.length} exercises, ${errors} errors`);
process.exit(errors ? 1 : 0);
