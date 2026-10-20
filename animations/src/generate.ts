// Generate the animation sets under a base directory:
//   <base>/lottie/          course exercises. The apps bundle this directory.
//   <base>/lottie-library/  exercises that no app course uses yet. No app bundles it.
// Each set holds <palette>/<id>.json for every exercise and palette, plus index.json.
// Used by src/build.ts (CLI) and scripts/check.ts.
import fs from 'node:fs';
import path from 'node:path';
import { compose, FPS, muscleEffort } from './compose.ts';
import { EXERCISES, type CourseExercise, type CourseId } from './courses.ts';
import { PALETTES, type PaletteName } from './palettes.ts';
import { MUSCLE_NAMES, type MuscleKey } from './rig.ts';

export const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];

/** Set directories in output order. A course exercise goes to `lottie`, a library exercise to `lottie-library`. */
export const SET_DIRS = ['lottie', 'lottie-library'] as const;
export type SetDir = (typeof SET_DIRS)[number];

const setOf = (ex: CourseExercise): SetDir => (ex.course === null ? 'lottie-library' : 'lottie');

/** One entry of index.json. The apps read this format. */
export interface IndexEntry {
  id: string;
  name: string;
  /** null only in lottie-library/: the exercise has an animation but no app course uses it yet. */
  course: CourseId | null;
  seconds: number;
  frames: number;
  /** 0-based frame that shows the exercise best. Show it when animations are off. */
  posterFrame: number;
  fps: number;
  muscles: { key: MuscleKey; name: string }[];
  /** Paths relative to index.json. */
  files: Record<PaletteName, string>;
}

export interface GenerateOptions {
  /** Exercise IDs whose animation files are rewritten. Default: all. index.json always lists every exercise of its set. */
  only?: string[];
  /** Receives one summary line per animation file. */
  log?: (line: string) => void;
}

export interface GenerateResult {
  /** Number of animation files that have IK or framing warnings. */
  warned: number;
}

/** Middle of the first span with the highest total muscle effort, unless the exercise sets `poster`. */
export function posterFrame(ex: CourseExercise, frames: number): number {
  if (ex.poster !== undefined) return Math.round(ex.poster * frames) % frames;
  const sums: number[] = [];
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (const m of ex.muscles ?? []) sum += muscleEffort(ex, m, f / frames);
    sums.push(sum);
  }
  const max = Math.max(...sums);
  const start = sums.findIndex((s) => s >= max - 1e-6);
  let end = start;
  while (end + 1 < frames && sums[end + 1]! >= max - 1e-6) end++;
  return Math.floor((start + end) / 2);
}

function indexEntry(ex: CourseExercise): IndexEntry {
  const frames = Math.round(ex.tl.total * FPS);
  const muscles = [...new Set((ex.muscles ?? []).map((m) => m.m))];
  return {
    id: ex.id, name: ex.name, course: ex.course, seconds: +(frames / FPS).toFixed(2), frames,
    posterFrame: posterFrame(ex, frames), fps: FPS,
    muscles: muscles.map((m) => ({ key: m, name: MUSCLE_NAMES[m] })),
    files: Object.fromEntries(PALETTE_NAMES.map((p) => [p, `${p}/${ex.id}.json`])) as Record<PaletteName, string>,
  };
}

/** Delete animation files of exercises that are not in the set, for example after a move from LIBRARY to COURSES. */
function pruneStale(setDir: string, ids: Set<string>): void {
  for (const palName of PALETTE_NAMES) {
    const dir = path.join(setDir, palName);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.json') && !ids.has(file.slice(0, -'.json'.length))) fs.rmSync(path.join(dir, file));
    }
  }
}

export function generate(baseDir: string, { only = [], log = () => {} }: GenerateOptions = {}): GenerateResult {
  const unknown = only.filter((id) => !EXERCISES.some((ex) => ex.id === id));
  if (unknown.length) throw new Error(`Unknown exercise IDs: ${unknown.join(', ')}`);

  let warned = 0;
  for (const set of SET_DIRS) {
    const exercises = EXERCISES.filter((ex) => setOf(ex) === set);
    const setDir = path.join(baseDir, set);
    fs.mkdirSync(setDir, { recursive: true });
    pruneStale(setDir, new Set(exercises.map((ex) => ex.id)));
    for (const ex of exercises) {
      if (only.length && !only.includes(ex.id)) continue;
      for (const palName of PALETTE_NAMES) {
        const { anim, warnings, frames, bbox } = compose(ex, palName);
        const dir = path.join(setDir, palName);
        fs.mkdirSync(dir, { recursive: true });
        const json = JSON.stringify(anim);
        fs.writeFileSync(path.join(dir, `${ex.id}.json`), json);
        const keys = (json.match(/"t":/g) ?? []).length;
        if (warnings.length) warned++;
        log(`${set.padEnd(14)} ${palName.padEnd(5)} ${ex.id.padEnd(23)} ${(json.length / 1024).toFixed(1).padStart(6)} KB  ${String(frames).padStart(4)} frames  ${String(keys).padStart(5)} keys  bbox=${bbox.join(',')}${warnings.length ? '  WARN ' + warnings.slice(0, 3).join(' | ') : ''}`);
      }
    }
    fs.writeFileSync(path.join(setDir, 'index.json'), JSON.stringify(exercises.map(indexEntry), null, 2) + '\n');
  }
  return { warned };
}

/** Every index entry under baseDir in set order, with the absolute directory that its `files` are relative to. */
export function readIndexes(baseDir: string): { entry: IndexEntry; dir: string }[] {
  return SET_DIRS.flatMap((set) => {
    const dir = path.join(baseDir, set);
    const entries = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8')) as IndexEntry[];
    return entries.map((entry) => ({ entry, dir }));
  });
}
