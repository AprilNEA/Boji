// Center one foot on the balance board and hold a tall single-leg stance.
// The free knee stays lifted while the arms open slightly to help maintain balance.
// The planted foot remains on the deck during the small controlled sway.
import type { FrontExercise } from '@/exercise.ts';
import { add3 } from '@/math3.ts';

const TAU = Math.PI * 2;

export default {
  id: 'balance-board-single-leg-stand',
  name: '平衡板单腿站立',
  view: 'front',
  tl: { total: 3 },
  meta: {
    en: 'Balance Board Single-Leg Stand',
    family: 'misc',
    equipment: ['other'],
    sources: ['hz:0020'],
  },
  muscles: [
    { m: 'quads', side: 'r', e: () => 0.75 },
    { m: 'calves', side: 'r', scale: 0.65, e: () => 0.7 },
    { m: 'glutes', scale: 0.45, e: () => 0.55, region: { view: 'front', part: 'pelvis', c: [0, 12], s: [34, 18] } },
  ],
  props: (pal) => ({ back: [
    { kind: 'oval', nm: 'balance-board-rocker', color: pal.metalDark, c: [0, 458], s: [52, 24] },
    { kind: 'oval', nm: 'balance-board-rocker-face', color: pal.metal, c: [0, 457], s: [28, 10] },
    { kind: 'box', nm: 'balance-board-deck', color: pal.propDark, c: [0, 446], s: [164, 14], r: 7 },
    { kind: 'box', nm: 'balance-board-grip', color: pal.prop, c: [0, 443], s: [132, 3], r: 1.5 },
  ] }),
  pose(t) {
    const sway = 2.2 * Math.sin(TAU * t);
    return {
      pelvis: [0, 209, 0],
      spine: { roll: -sway },
      legs: {
        // The figure's right foot is centered on the board; the other leg is held clear of the deck.
        r: { target: [0, 26, 5] },
        l: { target: [62, 118, 88], pole: [1, 0.25, 1] },
      },
      arms: {
        l: { target: (J) => add3(J.shoulder_l, [88, -44, 14]) },
        r: { target: (J) => add3(J.shoulder_r, [-88, -44, 14]) },
      },
    };
  },
} satisfies FrontExercise;
