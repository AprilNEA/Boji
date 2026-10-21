import { add, ang, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import { timeline, type Timeline } from '@/math/timeline.ts';
import type { Joints, LimbSpec, Pose } from '@/rig/side.ts';
import { A, G, hipForShoulder } from '@/exercises/common.ts';

/** Controlled descent, brief bottom pause, then a slower return to the same single-leg balance. */
export const pistolTL = timeline([
  { d: 1.35, from: 0, to: 1, e: [0.35, 0.95] },
  { d: 0.35, from: 1, to: 1, e: [0.95, 0.85] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.4] },
  { d: 0.45, from: 0, to: 0, e: [0.4, 0.3] },
]);

const SUPPORT_X = 260;
const FREE_LEG: LimbSpec = { a1: 0, a2: 0, foot: 0 };

type ArmStyle = 'forward' | 'sides' | 'goblet' | 'back-bar';

function gobletArm(dx: number, p: number): LimbSpec {
  return {
    // Keep the bell in front of the chest, not down through the raised thigh at the bottom.
    target: (J: Joints): Vec2 => add(add(J.B(0.84), mul(J.A(0.84), 75 + dx)), mul(J.T(0.84), 60 * p)),
    side: (J: Joints): Vec2 => mul(J.T(0.6), -1),
    hand: (J: Joints): number => ang(J.T(0.84)) + 8,
  };
}

function backBarArm(dx: number): LimbSpec {
  return {
    // Hands sit just behind the upper back, at a conventional high-bar grip.
    target: (J: Joints): Vec2 => add(J.B(0.88), [-22 + dx, 2]),
    side: [-1, 0],
    hand: 180,
  };
}

function arms(style: ArmStyle, p: number): Pose['arms'] {
  switch (style) {
    case 'forward':
      return {
        near: { a1: 0, a2: 0, hand: 0 },
        far: { a1: 2, a2: 0, hand: 0 },
      };
    case 'sides':
      return {
        near: { a1: 90, a2: 90, hand: 90 },
        far: { a1: 91, a2: 90, hand: 90 },
      };
    case 'goblet':
      return { near: gobletArm(0, p), far: gobletArm(-3, p) };
    case 'back-bar':
      return { near: backBarArm(0), far: backBarArm(-4) };
  }
}

/**
 * One supported-leg pistol squat. The near foot is the working, planted foot.
 * The far leg stays straight and horizontal from the hip, so it never touches the floor.
 */
export function pistolPose(t: number, style: ArmStyle): Pose {
  const p = pistolTL.at(t).p;
  const hipBack = Math.sin((p * Math.PI) / 2);
  const hipDown = 1 - Math.cos((p * Math.PI) / 2);
  return {
    // Start: knee 175°. Bottom: knee 86°, thigh near parallel, torso forward 34°.
    hip: [lerp(SUPPORT_X, SUPPORT_X - 72, hipBack), lerp(G - A - 183.8, G - A - 103, hipDown)],
    spine: { lumbar: lerp(-88, -54, p), thoracic: lerp(-91, -58, p) },
    neck: lerp(-87, -65, p),
    head: lerp(-90, -75, p),
    legs: {
      near: { target: [SUPPORT_X, G - A], foot: 0, side: [1, 0] },
      far: FREE_LEG,
    },
    arms: arms(style, p),
  };
}

export const SMITH_RAIL_X = 240;
const SMITH_SUPPORT_X = 268;

/** The Smith bar travels vertically while the support foot stays about 13 cm in front of the rail. */
export const smithBarY = (t: number): number => lerp(143.4, 239.5, pistolTL.at(t).p);

/**
 * Single-leg Smith squat with the upper-back bar fixed to its rail.
 * The bar rises and falls vertically; the support heel stays planted in front of it.
 */
export function smithPistolPose(t: number): Pose {
  const p = pistolTL.at(t).p;
  const spine = { lumbar: lerp(-88, -54, p), thoracic: lerp(-91, -58, p) };
  const barY = smithBarY(t);
  // The shoulder is forward of a high bar while the bar itself remains on the rail.
  const shoulder: Vec2 = [SMITH_RAIL_X + 23, barY + 7];
  return {
    hip: hipForShoulder(shoulder, spine),
    spine,
    neck: lerp(-87, -65, p),
    head: lerp(-90, -75, p),
    legs: {
      near: { target: [SMITH_SUPPORT_X, G - A], foot: 0, side: [1, 0] },
      far: FREE_LEG,
    },
    arms: {
      near: { target: [SMITH_RAIL_X, barY], side: [-1, 0], hand: 180 },
      far: { target: [SMITH_RAIL_X - 4, barY], side: [-1, 0], hand: 180 },
    },
  };
}

export type SingleLegTimeline = Timeline;
