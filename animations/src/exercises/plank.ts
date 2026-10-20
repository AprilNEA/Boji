// 平板支撑 (plank). Forearm plank held still; the loop shows one slow breath. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import { add, breath, dir, mul, type Vec2 } from '@/math.ts';
import { BODY, solve, type Pose } from '@/rig.ts';
import { FLOOR } from './common.ts';

const TOTAL = 4.0;
const ELBOW_Y = FLOOR - 8;
/** Toes on the mat with the heel up: 40 sin(85°) + 13 cos(85°) ≈ 41. */
const FOOT = 85;

const PLANK = (() => {
  const ankle: Vec2 = [150, FLOOR - 41];
  const body = (th: number, breath: number): Omit<Pose, 'arms'> => ({
    hip: add(ankle, mul(dir(th), BODY.thigh + BODY.shin - 3)),
    farHip: 0, farShoulder: 0,
    spine: { lumbar: th - 0.4 * breath, thoracic: th - 1 - 0.8 * breath },
    neck: th - 4, head: th + 3,
    legs: {
      near: { target: ankle, side: [0, 1], foot: FOOT },
      far: { target: add(ankle, [-2, 0]), side: [0, 1], foot: FOOT },
    },
  });
  // Raise the body line until the upper arm stands vertical with the elbow on the mat.
  const arms = { near: { a1: 90, a2: 0, hand: 0 }, far: { a1: 90, a2: -2, hand: -2 } };
  let th = -6;
  for (let i = 0; i < 80 && solve({ ...body(th, 0), arms }).S[1] > ELBOW_Y - BODY.upper; i++) th -= 0.25;
  return { body, arms, th };
})();


const plank = {
  id: 'plank', name: '平板支撑', tl: { total: TOTAL }, mat: true,
  muscles: [
    { m: 'abs', e: (t: number) => 0.75 + 0.2 * breath(t) },
    { m: 'glutes', e: () => 0.5 },
    { m: 'delts', side: 'near', e: () => 0.4 },
  ],
  pose(t) {
    return { ...PLANK.body(PLANK.th, breath(t)), arms: PLANK.arms };
  },
} satisfies Exercise;

export default plank;
