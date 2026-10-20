// Generate the animation sets under a base directory:
//   <base>/lottie/          course exercises. The apps bundle this directory. Git tracks it.
//   <base>/lottie-library/  exercises that no app course uses yet. No app bundles it. Git ignores it.
// Each set holds <palette>/<id>.json for every exercise and palette, plus index.json.
// generateCatalog writes every exercise into one directory for the asset host.
// Used by src/build.ts, src/build-assets.ts and scripts/check.ts.
import fs from 'node:fs';
import path from 'node:path';
import { compose, FPS } from './compose.ts';
import { EXERCISES, type CourseExercise, type CourseId } from './courses.ts';
import { PALETTES, type PaletteName } from './palettes.ts';
import { posterFrame } from './poster.ts';
import { MUSCLE_NAMES, type MuscleKey } from './rig.ts';

export { posterFrame };
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

function checkIds(only: string[]): void {
  const unknown = only.filter((id) => !EXERCISES.some((ex) => ex.id === id));
  if (unknown.length) throw new Error(`Unknown exercise IDs: ${unknown.join(', ')}`);
}

/** Write every palette of the given exercises into setDir, plus index.json. Returns the number of warned files. */
function writeSet(setDir: string, label: string, exercises: CourseExercise[], only: string[], log: (line: string) => void): number {
  let warned = 0;
  fs.mkdirSync(setDir, { recursive: true });
  pruneStale(setDir, new Set(exercises.map((ex) => ex.id)));
  for (const ex of exercises) {
    if (only.length && !only.includes(ex.id)) continue;
    for (const palName of PALETTE_NAMES) {
      const { anim, warnings, frames, bbox, zoom } = compose(ex, palName);
      const dir = path.join(setDir, palName);
      fs.mkdirSync(dir, { recursive: true });
      const json = JSON.stringify(anim);
      fs.writeFileSync(path.join(dir, `${ex.id}.json`), json);
      const keys = (json.match(/"t":/g) ?? []).length;
      if (warnings.length) warned++;
      log(`${label.padEnd(14)} ${palName.padEnd(5)} ${ex.id.padEnd(23)} ${(json.length / 1024).toFixed(1).padStart(6)} KB  ${String(frames).padStart(4)} frames  ${String(keys).padStart(5)} keys  bbox=${bbox.join(',')}${zoom < 1 ? `  zoom=${zoom}` : ''}${warnings.length ? '  WARN ' + warnings.slice(0, 3).join(' | ') : ''}`);
    }
  }
  fs.writeFileSync(path.join(setDir, 'index.json'), JSON.stringify(exercises.map(indexEntry), null, 2) + '\n');
  return warned;
}

export function generate(baseDir: string, { only = [], log = () => {} }: GenerateOptions = {}): GenerateResult {
  checkIds(only);
  let warned = 0;
  for (const set of SET_DIRS) {
    warned += writeSet(path.join(baseDir, set), set, EXERCISES.filter((ex) => setOf(ex) === set), only, log);
  }
  return { warned };
}

/**
 * Write every exercise, course and library, into one directory for the asset host:
 * <outDir>/index.json and <outDir>/<palette>/<id>.json. `course` is null for library exercises.
 * Deletes files of exercises that no longer exist.
 */
export function generateCatalog(outDir: string, { only = [], log = () => {} }: GenerateOptions = {}): GenerateResult {
  checkIds(only);
  return { warned: writeSet(outDir, 'catalog', EXERCISES, only, log) };
}

/**
 * Every index entry under baseDir in set order, with the absolute directory that its `files` are relative to.
 * Skips a set without index.json: Git does not track lottie-library/, so a fresh clone lacks it until `pnpm build`.
 * `sets` limits the sets that are read. Default: all.
 */
export function readIndexes(baseDir: string, sets: readonly SetDir[] = SET_DIRS): { entry: IndexEntry; dir: string }[] {
  return sets.flatMap((set) => {
    const dir = path.join(baseDir, set);
    const file = path.join(dir, 'index.json');
    if (!fs.existsSync(file)) return [];
    const entries = JSON.parse(fs.readFileSync(file, 'utf8')) as IndexEntry[];
    return entries.map((entry) => ({ entry, dir }));
  });
}
