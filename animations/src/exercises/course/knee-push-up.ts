// 跪姿俯卧撑 (knee-push-up). The body pivots on the knees and the wrists stay planted. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import { add, dir, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { BODY, solve, type Pose } from '@/rig/side.ts';
import { FLOOR, QUAD, kneelLeg, plantedArm } from '@/exercises/common.ts';

const pushTL = timeline([
  { d: 1.4, from: 0, to: 1, e: [0.3, 0.55] },
  { d: 0.2, from: 1, to: 1, e: [0.55, 0.75] },
  { d: 1.0, from: 1, to: 0, e: [1, 0.85] },
  { d: 0.7, from: 0, to: 0, e: [0.85, 0.3] },
]);

const WRIST_Y = FLOOR - 7;

const KNEE = (() => {
  const K = QUAD.K;
  /** phi: angle of the straight knee-to-shoulder line above the mat, in degrees. */
  const body = (phi: number): Omit<Pose, 'arms'> => {
    const up = -phi;
    const hip = add(K, mul(dir(up), BODY.thigh));
    return {
      hip, farHip: 0, farShoulder: 0,
      spine: { lumbar: up, thoracic: up - 1 },
      neck: up - 3, head: up + 3,
      legs: { near: kneelLeg(hip), far: kneelLeg(hip) },
    };
  };
  const probeArms = { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } };
  const shoulderAt = (phi: number): Vec2 => solve({ ...body(phi), arms: probeArms }).S;
  // Top: the arm is almost straight above the wrist. Bottom: the chest is a hand's width above the mat.
  let top = 20;
  for (let i = 0; i < 120 && shoulderAt(top)[1] > WRIST_Y - 121; i++) top += 0.25;
  let bottom = top;
  for (let i = 0; i < 160 && shoulderAt(bottom)[1] < WRIST_Y - 52; i++) bottom -= 0.25;
  const wrist: Vec2 = [shoulderAt(top)[0] + 8, WRIST_Y];
  return { body, top, bottom, wrist, wristFar: add(wrist, [-3, 0]) as Vec2 };
})();

const kneePushUp = {
  id: 'knee-push-up', name: '跪姿俯卧撑', tl: pushTL, mat: true,
  muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both' }, { m: 'abs', scale: 0.4 }],
  pose(t) {
    const { p } = pushTL.at(t);
    return {
      ...KNEE.body(lerp(KNEE.top, KNEE.bottom, p)),
      arms: { near: plantedArm(KNEE.wrist), far: plantedArm(KNEE.wristFar) },
    };
  },
} satisfies Exercise;

export default kneePushUp;
