// Library discovery without side effects. Every src/exercises/library/<family>/<id>.ts file default-exports one
// exercise; the directory name is the family. Files whose names start with "_" are helpers, not exercises.
// scripts/family.ts imports this module directly, so it loads only the family it builds.
import fs from 'node:fs';
import path from 'node:path';
import type { Exercise } from '@/exercise.ts';

const here = import.meta.dirname;

/** Families: the subdirectories of src/exercises/library, sorted. */
export const familyNames = (): string[] =>
  fs.readdirSync(here, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();

/**
 * Import the exercise files of one family; each must default-export a matching exercise.
 * ids: import only these files (`<id>.ts`), so that unfinished files of other authors in the same directory do not matter.
 * Throws when a requested file does not exist.
 */
export async function loadFamily(family: string, ids?: readonly string[]): Promise<Exercise[]> {
  const dir = path.join(here, family);
  const all = fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && !f.startsWith('_')).sort();
  const files = ids?.length ? ids.map((id) => `${id}.ts`) : all;
  for (const f of files) if (!all.includes(f)) throw new Error(`library/${family}/${f}: no such file`);
  const out: Exercise[] = [];
  for (const f of files) {
    const mod = (await import(path.join(dir, f))) as { default?: Exercise };
    const ex = mod.default;
    if (!ex || typeof ex.pose !== 'function') throw new Error(`library/${family}/${f}: no default-exported exercise`);
    if (`${ex.id}.ts` !== f) throw new Error(`library/${family}/${f}: file name must be "${ex.id}.ts"`);
    if (ex.meta?.family !== family) throw new Error(`library/${family}/${f}: meta.family must be "${family}"`);
    out.push(ex);
  }
  return out;
}
