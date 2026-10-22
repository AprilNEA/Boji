// Generate the animation sets:
//   <base>/lottie/          exercises of bundled courses. The apps bundle this directory. Git tracks it.
//   <base>/lottie-library/  exercises that no course uses. No app bundles it. Git ignores it.
//   catalog directory       every course exercise, bundled or not, for the asset host. Default:
//                           assets/public/animations/exercises/v1. Git tracks it, and the asset host deploys it.
// Each set holds <palette>/<id>.json for every exercise and palette, plus index.json.
// Used by cli.ts, assets.ts and scripts/check.ts.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { compose, FPS } from '@/compose/index.ts';
import { EXERCISES, type CourseExercise, type CourseId } from '@/courses.ts';
import { PALETTES, type PaletteName } from '@/draw/palettes.ts';
import { posterFrame } from './poster.ts';
import { MUSCLE_NAMES, type MuscleKey } from '@/rig/side.ts';

export { posterFrame };
export const PALETTE_NAMES = Object.keys(PALETTES) as PaletteName[];

/**
 * The asset catalog, served at https://assets.leanmuscle.club/animations/exercises/v1/.
 * `v1` is the format version of index.json. Change it only for a change that breaks existing readers.
 */
export const DEFAULT_CATALOG_DIR = path.resolve(import.meta.dirname, '../../../assets/public/animations/exercises/v1');

/** Set directories under the base directory, in output order. */
export const SET_DIRS = ['lottie', 'lottie-library'] as const;
export type SetDir = (typeof SET_DIRS)[number];

const inSet: Record<SetDir, (ex: CourseExercise) => boolean> = {
  lottie: (ex) => ex.bundled,
  'lottie-library': (ex) => ex.course === null,
};
const inCatalog = (ex: CourseExercise): boolean => ex.course !== null;

/** One entry of index.json. The apps read this format and ignore unknown fields. */
export interface IndexEntry {
  id: string;
  name: string;
  /** The first course that uses the exercise. null only in lottie-library/. */
  course: CourseId | null;
  /** Every course that uses the exercise, in course order. Empty only in lottie-library/. */
  courses: CourseId[];
  seconds: number;
  frames: number;
  /** 0-based frame that shows the exercise best. Show it when animations are off. */
  posterFrame: number;
  fps: number;
  muscles: { key: MuscleKey; name: string }[];
  /** Paths relative to index.json. */
  files: Record<PaletteName, string>;
  /** Lowercase hex SHA-256 of each file's bytes. A client checks a downloaded file against it. */
  sha256: Record<PaletteName, string>;
}

export interface GenerateOptions {
  /** Exercise IDs whose animation files are rewritten. Default: all. index.json always lists every exercise of its set. */
  only?: string[];
  /** Receives one summary line per composed animation. */
  log?: (line: string) => void;
}

export interface GenerateResult {
  /** Number of composed animations that have IK or framing warnings. */
  warned: number;
}

/** Composes each exercise and palette at most once per run, so a file that goes to two sets costs one compose. */
class Writer {
  warned = 0;
  private readonly cache = new Map<string, string>();
  private readonly only: string[];
  private readonly log: (line: string) => void;

  constructor(only: string[], log: (line: string) => void) {
    this.only = only;
    this.log = log;
    const unknown = only.filter((id) => !EXERCISES.some((ex) => ex.id === id));
    if (unknown.length) throw new Error(`Unknown exercise IDs: ${unknown.join(', ')}`);
  }

  private compose(ex: CourseExercise, palName: PaletteName, label: string): string {
    const key = `${palName}/${ex.id}`;
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;
    const { anim, warnings, frames, bbox, zoom } = compose(ex, palName);
    const json = JSON.stringify(anim);
    const keys = (json.match(/"t":/g) ?? []).length;
    if (warnings.length) this.warned++;
    this.log(`${label.padEnd(14)} ${palName.padEnd(5)} ${ex.id.padEnd(23)} ${(json.length / 1024).toFixed(1).padStart(6)} KB  ${String(frames).padStart(4)} frames  ${String(keys).padStart(5)} keys  bbox=${bbox.join(',')}${zoom < 1 ? `  zoom=${zoom}` : ''}${warnings.length ? '  WARN ' + warnings.slice(0, 3).join(' | ') : ''}`);
    this.cache.set(key, json);
    return json;
  }

  /** The file content: composed when the run rewrites the exercise or the file is missing, read otherwise. */
  private content(ex: CourseExercise, palName: PaletteName, file: string, label: string): string {
    const rewrite = !this.only.length || this.only.includes(ex.id);
    if (!rewrite && fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
    const json = this.compose(ex, palName, label);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, json);
    return json;
  }

  /** Write every palette of the given exercises into setDir, plus index.json. Deletes files of other exercises. */
  writeSet(setDir: string, label: string, exercises: CourseExercise[]): void {
    fs.mkdirSync(setDir, { recursive: true });
    pruneStale(setDir, new Set(exercises.map((ex) => ex.id)));
    const entries = exercises.map((ex) => {
      const files = Object.fromEntries(PALETTE_NAMES.map((p) => [p, `${p}/${ex.id}.json`])) as Record<PaletteName, string>;
      const sha256 = Object.fromEntries(PALETTE_NAMES.map((p) => {
        const json = this.content(ex, p, path.join(setDir, files[p]), label);
        return [p, createHash('sha256').update(json).digest('hex')];
      })) as Record<PaletteName, string>;
      return indexEntry(ex, files, sha256);
    });
    fs.writeFileSync(path.join(setDir, 'index.json'), JSON.stringify(entries, null, 2) + '\n');
  }
}

function indexEntry(ex: CourseExercise, files: Record<PaletteName, string>, sha256: Record<PaletteName, string>): IndexEntry {
  const frames = Math.round(ex.tl.total * FPS);
  const muscles = [...new Set((ex.muscles ?? []).map((m) => m.m))];
  return {
    id: ex.id, name: ex.name, course: ex.course, courses: ex.courses, seconds: +(frames / FPS).toFixed(2), frames,
    posterFrame: posterFrame(ex, frames), fps: FPS,
    muscles: muscles.map((m) => ({ key: m, name: MUSCLE_NAMES[m] })),
    files, sha256,
  };
}

/** Delete animation files of exercises that are not in the set, for example after a course adopts a library exercise. */
function pruneStale(setDir: string, ids: Set<string>): void {
  for (const palName of PALETTE_NAMES) {
    const dir = path.join(setDir, palName);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith('.json') && !ids.has(file.slice(0, -'.json'.length))) fs.rmSync(path.join(dir, file));
    }
  }
}

/**
 * Write lottie/ and lottie-library/ under baseDir, and the asset catalog into catalogDir.
 * catalogDir null skips the catalog.
 */
export function generate(baseDir: string, catalogDir: string | null, { only = [], log = () => {} }: GenerateOptions = {}): GenerateResult {
  const writer = new Writer(only, log);
  for (const set of SET_DIRS) writer.writeSet(path.join(baseDir, set), set, EXERCISES.filter(inSet[set]));
  if (catalogDir !== null) writer.writeSet(catalogDir, 'catalog', EXERCISES.filter(inCatalog));
  return { warned: writer.warned };
}

/** Write only the asset catalog: <outDir>/index.json and <outDir>/<palette>/<id>.json for every course exercise. */
export function generateCatalog(outDir: string, { only = [], log = () => {} }: GenerateOptions = {}): GenerateResult {
  const writer = new Writer(only, log);
  writer.writeSet(outDir, 'catalog', EXERCISES.filter(inCatalog));
  return { warned: writer.warned };
}

/** The entries of one index.json, with the absolute directory that their `files` are relative to. [] when it is missing. */
export function readIndex(dir: string): { entry: IndexEntry; dir: string }[] {
  const file = path.join(dir, 'index.json');
  if (!fs.existsSync(file)) return [];
  const entries = JSON.parse(fs.readFileSync(file, 'utf8')) as IndexEntry[];
  return entries.map((entry) => ({ entry, dir }));
}

/**
 * Every index entry under baseDir in set order, with the absolute directory that its `files` are relative to.
 * Skips a set without index.json: Git does not track lottie-library/, so a fresh clone lacks it until `pnpm build`.
 * `sets` limits the sets that are read. Default: all.
 */
export function readIndexes(baseDir: string, sets: readonly SetDir[] = SET_DIRS): { entry: IndexEntry; dir: string }[] {
  return sets.flatMap((set) => readIndex(path.join(baseDir, set)));
}
