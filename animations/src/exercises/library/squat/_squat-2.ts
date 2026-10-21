// Private builders for squat-2. Every standing pose keeps both soles planted unless the source asks for a lifted foot.
import { add, ang, dir, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline, type Timeline } from '@/math/timeline.ts';
import type { Joints, LimbPair, LimbSpec, Pose } from '@/rig/side.ts';
import { A, ARM_STRAIGHT, G, GRIP_IN_HAND } from '@/exercises/common.ts';

export const X0 = 280;

export type SquatOptions = {
  x?: number;
  farDx?: number;
  floorLift?: number;
  /** Hip height above the ankle at the bottom. 104 gives thighs about parallel. */
  bottom?: number;
  /** Hip travel behind the ankle at the bottom. */
  back?: number;
  /** Forward torso lean at the bottom. */
  lean?: number;
};

const legsAt = (x: number, ankleY: number, farDx: number): LimbPair => ({
  near: { target: [x, ankleY], foot: 0, side: [1, 0] },
  far: { target: [x + farDx, ankleY], foot: 0, side: [1, 0] },
});

/** A planted, balanced squat. The hips move back before dropping, and the spine stays neutral. */
export function squatPose(p: number, arms: LimbPair, opts: SquatOptions = {}): Pose {
  const x = opts.x ?? X0;
  const ankleY = G - A - (opts.floorLift ?? 0);
  const back = opts.back ?? 80;
  const bottom = opts.bottom ?? 104;
  const lean = opts.lean ?? 43;
  // 183.9 px leaves 0.1 px of IK slack and gives a 176° standing knee.
  const standingHeight = 183.9;
  const farDx = opts.farDx ?? -6;
  const travel = Math.sin((p * Math.PI) / 2);
  const drop = 1 - Math.cos((p * Math.PI) / 2);
  return {
    hip: [lerp(x - 2, x - back, travel), lerp(ankleY - standingHeight, ankleY - bottom, drop)],
    spine: { lumbar: lerp(-88, -88 + lean, p), thoracic: lerp(-91, -91 + lean - 4, p) },
    neck: lerp(-86, -86 + lean * 0.63, p),
    head: lerp(-88, -88 + lean * 0.32, p),
    legs: legsAt(x, ankleY, farDx),
    arms,
  };
}

/** Arms hang down beside the legs, suitable for unweighted and dumbbell squats. */
export const hangingArms = (): LimbPair => ({
  near: { a1: 92, a2: 86, hand: 86 },
  far: { a1: 95, a2: 88, hand: 88 },
});

/** The forearms fold around the upper back. The wrists stay close to the upper-back bar. */
export const backRackArms = (): LimbPair => ({
  near: { a1: 137, a2: -29, hand: -18 },
  far: { a1: 140, a2: -26, hand: -16 },
});

/** The elbows stay forward and high while the load rests at the chest or shoulders. */
export const frontRackArms = (): LimbPair => ({
  near: {
    target: (J) => add(add(J.B(0.79), mul(J.A(0.79), 30)), mul(J.T(0.79), -10)),
    side: (J) => mul(J.T(0.7), -1),
    hand: (J) => ang(J.T(0.8)) + 12,
  },
  far: {
    target: (J) => add(add(J.B(0.79), mul(J.A(0.79), 27)), mul(J.T(0.79), -13)),
    side: (J) => mul(J.T(0.7), -1),
    hand: (J) => ang(J.T(0.8)) + 12,
  },
});

/** Both hands cup a single weight in front of the sternum, with elbows directed down. */
export const gobletArms = (): LimbPair => ({
  near: {
    target: (J) => add(add(J.B(0.84), mul(J.A(0.84), 27)), mul(J.T(0.84), -8)),
    side: (J) => mul(J.T(0.6), -1),
    hand: (J) => ang(J.T(0.84)) + 8,
  },
  far: {
    target: (J) => add(add(J.B(0.84), mul(J.A(0.84), 24)), mul(J.T(0.84), -11)),
    side: (J) => mul(J.T(0.6), -1),
    hand: (J) => ang(J.T(0.84)) + 8,
  },
});

/** Both elbows are folded, and the bar lies in the elbow creases. */
export const zercherArms = (): LimbPair => ({
  near: { a1: 78, a2: -13, hand: -6 },
  far: { a1: 81, a2: -11, hand: -5 },
});

/** Locked overhead arms. The far wrist follows the far shoulder so both elbows match. */
export const overheadArms = (): LimbPair => ({
  near: { target: (J) => add(J.S, [0, -ARM_STRAIGHT]), side: [-1, 0], hand: -90 },
  far: { target: (J) => add(J.Sf, [0, -ARM_STRAIGHT]), side: [-1, 0], hand: -90 },
});

/** Arms travel from a relaxed, downward position at the squat bottom to a tall overhead reach. */
export function reachArms(squat: number): LimbPair {
  const a = lerp(-90, 86, squat);
  return {
    near: { target: (J) => add(J.S, mul(dir(a), ARM_STRAIGHT - 1)), side: [-1, 0], hand: a },
    far: { target: (J) => add(J.Sf, mul(dir(a), ARM_STRAIGHT - 1)), side: [-1, 0], hand: a },
  };
}

/** A loaded front rack blends into a locked overhead press. */
export function pressArms(press: number): LimbPair {
  const rack = (J: Joints, far: boolean): Vec2 => {
    const s = far ? 0.76 : 0.8;
    const d = far ? 23 : 28;
    return add(add(J.B(s), mul(J.A(s), d)), mul(J.T(s), -9));
  };
  const arm = (far: boolean): LimbSpec => ({
    target: (J) => {
      const S = far ? J.Sf : J.S;
      return [
        lerp(rack(J, far)[0], S[0], press),
        lerp(rack(J, far)[1], S[1] - ARM_STRAIGHT, press),
      ];
    },
    side: [-1, 0],
    hand: lerp(12, -90, press),
  });
  return { near: arm(false), far: arm(true) };
}

/** A single central handle held low between the thighs; both elbows remain softly bent. */
export const lowCentralArms = (): LimbPair => ({
  near: {
    target: (J) => add(add(J.B(0.08), mul(J.A(0.08), 27)), mul(J.T(0.08), -4)),
    side: [1, 0], hand: 90,
  },
  far: {
    target: (J) => add(add(J.B(0.08), mul(J.A(0.08), 23)), mul(J.T(0.08), -6)),
    side: [1, 0], hand: 90,
  },
});

/** Approximate center of an upper-back bar in profile. */
export const backBarAt = (J: Joints): Vec2 => add(J.B(0.86), mul(J.A(0.86), -11));
/** The visible plate sits at the near hand's grip, which is 9 px past the wrist. */
export const grip = (J: Joints, side: 'n' | 'f' = 'n'): Vec2 => add(J[`wrist_${side}`], mul(dir(J[`hand_${side}`].a), GRIP_IN_HAND));
/** Bar or kettlebell handle above a locked near arm. */
export const overheadGrip = (J: Joints): Vec2 => grip(J, 'n');
/** The Zercher bar crosses the folded near elbow. */
export const zercherBarAt = (J: Joints): Vec2 => add(J.elbow_n, [1, 1]);

/** Normal strength squat: controlled lowering, a short bottom pause, and a smooth return. */
export const squatTL = (hold = 0.3): Timeline => timeline([
  { d: 1.35, from: 0, to: 1, e: [0.25, 0.9] },
  { d: hold, from: 1, to: 1, e: [0.9, 1] },
  { d: 1.25, from: 1, to: 0, e: [1, 0.45] },
  { d: 0.45, from: 0, to: 0, e: [0.35, 0.25] },
]);

/** Fast, controlled speed-squat cycle with no bounce at the bottom. */
export const speedSquatTL: Timeline = timeline([
  { d: 0.7, from: 0, to: 1, e: [0.3, 0.8] },
  { d: 0.08, from: 1, to: 1, e: [0.8, 0.95] },
  { d: 0.48, from: 1, to: 0, e: [1, 0.45] },
  { d: 0.2, from: 0, to: 0, e: [0.35, 0.3] },
]);

/**
 * One thruster repetition: descend in a rack, stand while pressing, briefly lock out,
 * lower back to the rack while standing, then rest. Values are continuous at the loop seam.
 */
export const thrusterTL: Timeline = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.4, 0.9] },
  { d: 0.2, from: 1, to: 1, e: [0.9, 1] },
  { d: 1.0, from: 1, to: 0, e: [1, 0.8] },
  { d: 0.25, from: 0, to: 0, e: [0.8, 0.75] },
  { d: 0.55, from: 0, to: 0, e: [0.65, 0.4] },
  { d: 0.35, from: 0, to: 0, e: [0.35, 0.3] },
]);

export function thrusterState(t: number): { squat: number; press: number } {
  const x = (((t % 1) + 1) % 1) * thrusterTL.total;
  if (x < 1) return { squat: smooth(x), press: 0 };
  if (x < 1.2) return { squat: 1, press: 0 };
  if (x < 2.2) { const u = smooth(x - 1.2); return { squat: 1 - u, press: u }; }
  if (x < 2.45) return { squat: 0, press: 1 };
  if (x < 3) return { squat: 0, press: 1 - smooth((x - 2.45) / 0.55) };
  return { squat: 0, press: 0 };
}
