// Stand with both feet on the center of a balance board and keep a soft, upright posture.
// The board stays level while the body makes a small, controlled lateral balance correction.
// Both feet remain planted on the deck throughout the hold.
import type { FrontExercise } from '@/exercise.ts';
import { add3 } from '@/math/vec3.ts';

const TAU = Math.PI * 2;

export default {
  id: 'balance-board-stand',
  name: '平衡板站立',
  view: 'front',
  tl: { total: 3 },
  meta: {
    en: 'Balance Board Stand',
    family: 'misc',
    equipment: ['other'],
    sources: ['fe:Balance_Board'],
  },
  muscles: [
    { m: 'calves', side: 'both', e: () => 0.7 },
    { m: 'quads', side: 'both', scale: 0.5, e: () => 0.55 },
    { m: 'glutes', scale: 0.35, e: () => 0.5, region: { view: 'front', part: 'pelvis', c: [0, 12], s: [34, 18] } },
  ],
  props: (pal) => ({ back: [
    { kind: 'oval', nm: 'balance-board-rocker', color: pal.metalDark, c: [0, 458], s: [52, 24] },
    { kind: 'oval', nm: 'balance-board-rocker-face', color: pal.metal, c: [0, 457], s: [28, 10] },
    { kind: 'box', nm: 'balance-board-deck', color: pal.propDark, c: [0, 446], s: [164, 14], r: 7 },
    { kind: 'box', nm: 'balance-board-grip', color: pal.prop, c: [0, 443], s: [132, 3], r: 1.5 },
  ] }),
  pose(t) {
    const sway = 1.6 * Math.sin(TAU * t);
    return {
      pelvis: [sway, 209.7, 0],
      spine: { roll: -sway * 0.7 },
      legs: {
        l: { target: [21, 26, 4] },
        r: { target: [-21, 26, 4] },
      },
      arms: {
        l: { target: (J) => add3(J.shoulder_l, [10, -118, 16]) },
        r: { target: (J) => add3(J.shoulder_r, [-10, -118, 16]) },
      },
    };
  },
} satisfies FrontExercise;
