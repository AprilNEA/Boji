// 标准俯卧撑 (push-up). High plank on the toes: the straight body pivots on the feet and the wrists stay planted. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '../exercise.ts';
import { add, dir, lerp, mul, timeline, type Vec2 } from '../math.ts';
import { BODY, solve, type Pose } from '../rig.ts';
import { FLOOR, plantedArm } from './common.ts';

const pushTL = timeline([
  { d: 1.5, from: 0, to: 1, e: [0.35, 0.6] },
  { d: 0.2, from: 1, to: 1, e: [0.6, 0.8] },
  { d: 1.0, from: 1, to: 0, e: [1, 0.85] },
  { d: 0.7, from: 0, to: 0, e: [0.85, 0.35] },
]);

const WRIST_Y = FLOOR - 7;
/** Toes on the mat with the heel up, as in the plank: 40 sin(85°) + 13 cos(85°) ≈ 41. */
const FOOT = 85;

/** High plank shared with the mountain climber. th: direction from the ankle to the hip, in degrees. */
export const HIGH_PLANK = (() => {
  const ankle: Vec2 = [120, FLOOR - 41];
  const body = (th: number): Omit<Pose, 'arms'> => ({
    hip: add(ankle, mul(dir(th), BODY.thigh + BODY.shin - 3)),
    farHip: 0, farShoulder: 0,
    spine: { lumbar: th, thoracic: th - 1 },
    neck: th - 4, head: th + 2,
    legs: {
      near: { target: ankle, side: [0, 1], foot: FOOT },
      far: { target: add(ankle, [-2, 0]), side: [0, 1], foot: FOOT },
    },
  });
  const probeArms = { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } };
  const shoulderAt = (th: number): Vec2 => solve({ ...body(th), arms: probeArms }).S;
  // Top: the arm is almost straight above the wrist. Bottom: the chest is a fist above the mat.
  let top = 0;
  for (let i = 0; i < 160 && shoulderAt(top)[1] > WRIST_Y - 121; i++) top -= 0.25;
  let bottom = top;
  for (let i = 0; i < 160 && shoulderAt(bottom)[1] < WRIST_Y - 50; i++) bottom += 0.25;
  const wrist: Vec2 = [shoulderAt(top)[0] + 6, WRIST_Y];
  return { ankle, body, top, bottom, wrist, wristFar: add(wrist, [-3, 0]) as Vec2 };
})();

const pushUp = {
  id: 'push-up', name: '标准俯卧撑', tl: pushTL, mat: true,
  muscles: [
    { m: 'pecs' },
    { m: 'triceps', side: 'both' },
    { m: 'abs', scale: 0.45 },
    { m: 'delts', side: 'near', scale: 0.5 },
  ],
  pose(t) {
    const { p } = pushTL.at(t);
    return {
      ...HIGH_PLANK.body(lerp(HIGH_PLANK.top, HIGH_PLANK.bottom, p)),
      arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) },
    };
  },
} satisfies Exercise;

export default pushUp;
