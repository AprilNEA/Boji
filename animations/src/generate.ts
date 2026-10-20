// Generate <outDir>/<palette>/<id>.json for every exercise and palette, plus <outDir>/index.json.
// Used by src/build.ts (CLI) and scripts/check.ts.
import fs from 'node:fs';
import path from 'node:path';
import { compose, FPS } from './compose.ts';
import { EXERCISES, type CourseId } from './courses.ts';
import { PALETTES, type PaletteName } from './palettes.ts';
import { MUSCLE_NAMES, type MuscleKey } from './rig.ts';

export const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];

/** One entry of index.json. The apps read this format. */
export interface IndexEntry {
  id: string;
  name: string;
  /** null: the exercise has an animation but no app course uses it yet. */
  course: CourseId | null;
  seconds: number;
  frames: number;
  fps: number;
  muscles: { key: MuscleKey; name: string }[];
  /** Paths relative to index.json. */
  files: Record<PaletteName, string>;
}

export interface GenerateOptions {
  /** Exercise IDs whose animation files are rewritten. Default: all. index.json always lists every exercise. */
  only?: string[];
  /** Receives one summary line per animation file. */
  log?: (line: string) => void;
}

export interface GenerateResult {
  /** Number of animation files that have IK or framing warnings. */
  warned: number;
}

export function generate(outDir: string, { only = [], log = () => {} }: GenerateOptions = {}): GenerateResult {
  const unknown = only.filter((id) => !EXERCISES.some((ex) => ex.id === id));
  if (unknown.length) throw new Error(`Unknown exercise IDs: ${unknown.join(', ')}`);

  let warned = 0;
  for (const ex of EXERCISES) {
    if (only.length && !only.includes(ex.id)) continue;
    for (const palName of PALETTE_NAMES) {
      const { anim, warnings, frames, bbox } = compose(ex, palName);
      const dir = path.join(outDir, palName);
      fs.mkdirSync(dir, { recursive: true });
      const json = JSON.stringify(anim);
      fs.writeFileSync(path.join(dir, `${ex.id}.json`), json);
      const keys = (json.match(/"t":/g) ?? []).length;
      if (warnings.length) warned++;
      log(`${palName.padEnd(5)} ${ex.id.padEnd(20)} ${(json.length / 1024).toFixed(1).padStart(6)} KB  ${String(frames).padStart(4)} frames  ${String(keys).padStart(5)} keys  bbox=${bbox.join(',')}${warnings.length ? '  WARN ' + warnings.slice(0, 3).join(' | ') : ''}`);
    }
  }

  const index: IndexEntry[] = EXERCISES.map((ex) => {
    const frames = Math.round(ex.tl.total * FPS);
    const muscles = [...new Set((ex.muscles ?? []).map((m) => m.m))];
    return {
      id: ex.id, name: ex.name, course: ex.course, seconds: +(frames / FPS).toFixed(2), frames, fps: FPS,
      muscles: muscles.map((m) => ({ key: m, name: MUSCLE_NAMES[m] })),
      files: Object.fromEntries(PALETTE_NAMES.map((p) => [p, `${p}/${ex.id}.json`])) as Record<PaletteName, string>,
    };
  });
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2) + '\n');
  return { warned };
}
