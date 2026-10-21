// Poster frame: the still image shown when animations are off. It has no dependency on the course registry, so
// scripts/family.ts can use it without loading every library family.
import { muscleEffort } from '@/compose/index.ts';
import type { Exercise } from '@/exercise.ts';

/** Middle of the first span with the highest total muscle effort, unless the exercise sets `poster`. */
export function posterFrame(ex: Exercise, frames: number): number {
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
