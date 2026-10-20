// Shared floor levels and base poses for exercise scripts.
import { add, ang, clamp, D2R, len, mul, sub, type Vec2 } from '@/math.ts';
import { BODY, GROUND, solve, type Joints, type LimbPair, type LimbSpec } from '@/rig.ts';

export const G = GROUND;
export const FLOOR = G - 6; // top of the exercise mat
export const A = BODY.ankleH; // ankle joint height above the ground

/**
 * Shoulder joint to wrist with the elbow straight, less 0.2 px of slack so the IK never runs out of reach.
 * The elbow angle is very sensitive near full reach: 1.5 px of slack already bends it to about 162°.
 */
export const ARM_STRAIGHT = BODY.upper + BODY.fore - 0.2;
/** Wrist to the middle of the closed hand, where a bar or handle sits. Matches gripAt in equipment/core.ts. */
export const GRIP_IN_HAND = 9;

/**
 * Hip position that puts the near shoulder joint (Joints.S) at S for the given spine. The shoulder joint is not
 * the top of the spine: it sits in front of and below the neck base. Use this instead of subtracting the spine
 * segments by hand when the arms must reach a fixed point, such as straight arms on a bar.
 */
export function hipForShoulder(S: Vec2, spine: { lumbar: number; thoracic: number }): Vec2 {
  const fixed: LimbSpec = { a1: 90, a2: 90 };
  const J = solve({ hip: [0, 0], spine, neck: spine.thoracic, head: spine.thoracic, legs: { near: fixed, far: fixed }, arms: { near: fixed, far: fixed } });
  return sub(S, J.S);
}

export const standLegs = (x0: number, farDx = -6): LimbPair => ({
  near: { target: [x0, G - A], foot: 0, side: [1, 0] },
  far: { target: [x0 + farDx, G - A], foot: 0, side: [1, 0] },
});

/** Foot angle that keeps the toes on the ground for ankle height h: 40 sin a + 13 cos a = h. */
export const toesDown = (h: number): number => {
  const ball: Vec2 = [40, 13];
  return Math.asin(clamp(h / len(ball), -1, 1)) / D2R - ang(ball);
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
