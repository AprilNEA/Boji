// Private helpers for stretch-lower-2. Every stretch reaches a visible end position, holds, then returns.
// Props stay simple and behind the person so contacts and the moving limbs remain legible.
import type { Props } from '@/exercise.ts';
import { timeline } from '@/math.ts';
import type { Palette } from '@/palettes.ts';

/** A calm static-stretch rhythm: enter for 1.8 s, hold for 3.2 s, return for 1.5 s, then rest. */
export const stretchTL = timeline([
  { d: 1.8, from: 0, to: 1, e: [0.25, 1] },
  { d: 3.2, from: 1, to: 1, e: [1, 0.95] },
  { d: 1.5, from: 1, to: 0, e: [0.9, 0.3] },
  { d: 0.5, from: 0, to: 0, e: [0.25, 0.2] },
]);

/** A simple upright wall whose inner face is at x. */
export const wall = (x: number, top = 104): ((pal: Palette) => Props) => (pal) => ({
  back: [
    { kind: 'box', nm: 'wall', color: pal.propLight, c: [x + 12, (top + 452) / 2], s: [24, 452 - top], r: 3 },
    { kind: 'box', nm: 'wall-edge', color: pal.propDark, c: [x, (top + 452) / 2], s: [4, 452 - top], r: 2 },
  ],
});

/** Low step for a heel or forefoot. Its top is y, close to the mat. */
export const step = (x: number, y: number, w = 112): ((pal: Palette) => Props) => (pal) => ({
  back: [
    { kind: 'box', nm: 'step-base', color: pal.propDark, c: [x, (y + 452) / 2], s: [w, 452 - y], r: 5 },
    { kind: 'box', nm: 'step-top', color: pal.propLight, c: [x, y + 5], s: [w + 4, 10], r: 4 },
  ],
});

/** A visible rope or strap line between two joint-dependent points. */
export const strap = <J>(at: (J: J) => [[number, number], [number, number]], nm = 'Strap') => ({
  nm,
  kind: 'line' as const,
  z: 'underNearArm' as const,
  width: 3.6,
  color: (pal: Palette) => pal.resistBand,
  at: (J: J) => at(J),
});

/** Two taut rope sides from both hands to one looped forefoot. */
export const loopedStrap = <J>(at: (J: J) => [[number, number], [number, number], [number, number]], nm = 'Strap') => [
  strap<J>((J) => { const [near, foot] = at(J); return [near, foot]; }, `${nm} near`),
  strap<J>((J) => { const [, foot, far] = at(J); return [foot, far]; }, `${nm} far`),
];
