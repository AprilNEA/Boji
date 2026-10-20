// Shared floor levels and base poses for exercise scripts.
import { add, ang, clamp, mul, sub, type Vec2 } from '../math.ts';
import { BODY, GROUND, solve, type Joints, type LimbPair, type LimbSpec } from '../rig.ts';

export const G = GROUND;
export const FLOOR = G - 6; // top of the exercise mat
export const A = BODY.ankleH; // ankle joint height above the ground

export const standLegs = (x0: number, farDx = -6): LimbPair => ({
  near: { target: [x0, G - A], foot: 0, side: [1, 0] },
  far: { target: [x0 + farDx, G - A], foot: 0, side: [1, 0] },
});

/** Foot angle that keeps the toes on the ground for ankle height h: 40 sin a + 13 cos a = h. */
export const toesDown = (h: number): number => {
  const r = Math.hypot(40, 13), phi = Math.atan2(13, 40);
  return (Math.asin(clamp(h / r, -1, 1)) - phi) * (180 / Math.PI);
};

/** Standing arm with the hand on the hip. dx shifts the hand for the far arm. */
export const handOnHip = (dx: number): LimbSpec => ({
  target: (J: Joints) => add(add(J.B(0.2), mul(J.A(0.2), 3)), [dx, 0]),
  hand: (J: Joints) => ang(J.T(0.2)) + 150,
});

// ---------- 四点跪姿基础 ----------
export const QUAD = (() => {
  const K: Vec2 = [205, FLOOR - 11];
  const hip: Vec2 = [K[0], K[1] - BODY.thigh];
  // Tilt the spine until the shoulder sits one arm length (minus a soft elbow) above the wrist.
  const probeAt = (a: number) => solve({ hip, spine: { lumbar: a, thoracic: a - 2 }, neck: -12, head: -10, farHip: 0, farShoulder: 0, legs: { near: { a1: 90, a2: 178 }, far: { a1: 90, a2: 178 } }, arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } } });
  let a = -10;
  for (let i = 0; i < 40 && probeAt(a).S[1] > FLOOR - 7 - 123.5; i++) a -= 0.25;
  const spine = { lumbar: a, thoracic: a - 2 };
  const probe = probeAt(a);
  const wrist: Vec2 = [probe.S[0] + 3, FLOOR - 7];
  const wristFar: Vec2 = [probe.Sf[0] + 2, FLOOR - 7];
  return { K, hip, spine, wrist, wristFar };
})();
export const kneelLeg = (hipPt: Vec2): LimbSpec => ({ a1: ang(sub(QUAD.K, hipPt)), a2: 178, foot: 180 });
/** Straight-ish supporting arm with the wrist planted at W. */
export const plantedArm = (W: Vec2): LimbSpec => ({ target: W, side: [-1, 0], hand: 0 });
