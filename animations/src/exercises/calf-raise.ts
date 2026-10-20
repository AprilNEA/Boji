// 提踵 (calf-raise). Standing, hands on the hips: the heels lift and the body rises over the balls of the feet. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '../exercise.ts';
import { D2R, timeline } from '../math.ts';
import { A, G, handOnHip } from './common.ts';

const raiseTL = timeline([
  { d: 0.9, from: 0, to: 1, e: [0.3, 1] },
  { d: 0.6, from: 1, to: 1, e: [1, 0.95] },
  { d: 1.3, from: 1, to: 0, e: [0.8, 0.3] },
  { d: 0.5, from: 0, to: 0, e: [0.25, 0.2] },
]);

const X0 = 270; // near ankle when standing
/** Foot angle at the top. About 34° lifts the heel by 9 to 10 cm. */
const FOOT_MAX = 34;

/**
 * Ankle offset for foot angle a when the ball of the foot stays on the ground.
 * The contact point sits 40 px along the foot and 13 px below it: see toesDown in common.ts.
 */
const overBall = (a: number): { dx: number; h: number } => {
  const r = a * D2R;
  return { dx: 40 - (40 * Math.cos(r) - 13 * Math.sin(r)), h: 40 * Math.sin(r) + 13 * Math.cos(r) };
};

const calfRaise = {
  id: 'calf-raise', name: '提踵', tl: raiseTL,
  muscles: [{ m: 'calves', side: 'both' }],
  pose(t) {
    const { p } = raiseTL.at(t);
    const a = FOOT_MAX * p;
    const { dx, h } = overBall(a);
    return {
      hip: [X0 - 8 + dx, G - A - 181 - (h - A)],
      spine: { lumbar: -89, thoracic: -91 },
      neck: -86, head: -88,
      legs: {
        near: { target: [X0 + dx, G - h], foot: a, side: [1, 0] },
        far: { target: [X0 - 6 + dx, G - h], foot: a, side: [1, 0] },
      },
      arms: { near: handOnHip(0), far: handOnHip(-4) },
    };
  },
} satisfies Exercise;

export default calfRaise;
