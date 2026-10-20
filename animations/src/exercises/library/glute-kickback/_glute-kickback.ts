// Shared side-view poses for the glute-kickback work list.
// Each alternate repeats from a stable base so both sides can be shown without a loop seam.
import type { Props, RigidPart } from '@/exercise.ts';
import { dir, lerp, mul, add, type Timeline, type Vec2 } from '@/math.ts';
import type { Palette } from '@/palettes.ts';
import type { Joints, LimbPair, LimbSpec } from '@/rig.ts';
import { A, G, QUAD, kneelLeg, plantedArm } from '@/exercises/common.ts';
import { workTL } from '@/exercises/equipment/index.ts';

export const STAND_X = 250;
export const STAND_ANKLE_Y = G - A;
export const STAND_HIP: Vec2 = [STAND_X, STAND_ANKLE_Y - 184];

const halfTL = workTL(0.5);
export const alternateTL: Timeline = {
  total: halfTL.total * 2,
  at: (t) => halfTL.at(t < 0.5 ? t * 2 : (t - 0.5) * 2),
};
export type WorkSide = 'near' | 'far';

/** One ordinary repetition per side. Both half cycles start and end in the same stable pose. */
export function alternate(t: number): { side: WorkSide; p: number; e: number } {
  const side: WorkSide = t < 0.5 ? 'near' : 'far';
  const phase = halfTL.at(t < 0.5 ? t * 2 : (t - 0.5) * 2);
  return { side, p: phase.p, e: phase.e };
}

export const activeValue = (t: number, side: WorkSide): number => alternate(t).side === side ? alternate(t).e : 0;

/** A planted standing leg, including a soft knee when the hip is slightly below full extension. */
export const plantedStandingLeg = (x = STAND_X): LimbSpec => ({ target: [x, STAND_ANKLE_Y], side: [1, 0], foot: 0 });

/**
 * An ankle travels from vertical to 35 degrees behind vertical, which shows hip extension without pelvic arching.
 * Bent-over variations pass their own top angle so the thigh can align with the stable torso.
 * The start is at standing ankle height, so the foot remains grounded between repetitions.
 */
export function hipExtensionTarget(hip: Vec2, p: number, topAngle = 125, reach = 184): Vec2 {
  return add(hip, mul(dir(lerp(90, topAngle, p)), reach));
}

export function hipExtensionLeg(p: number, hip: Vec2, topAngle = 125, reach = 184): LimbSpec {
  return { target: hipExtensionTarget(hip, p, topAngle, reach), side: [1, 0], foot: 0 };
}

export function hipExtensionLegs(side: WorkSide, p: number, hip: Vec2, topAngle = 125, reach = 184): LimbPair {
  const work = hipExtensionLeg(p, hip, topAngle, reach);
  const support = plantedStandingLeg();
  return side === 'near' ? { near: work, far: support } : { near: support, far: work };
}

/** Standing leg curl: the thigh stays almost vertical while the heel closes toward the glute. */
export function standingCurlLegs(side: WorkSide, p: number): LimbPair {
  const curl: LimbSpec = { a1: lerp(90, 96, p), a2: lerp(90, 225, p), foot: 0 };
  const support = plantedStandingLeg();
  return side === 'near' ? { near: curl, far: support } : { near: support, far: curl };
}

export const quadBase = { hip: QUAD.hip, spine: QUAD.spine, neck: -12, head: -10, farHip: 0, farShoulder: 0 };

export function quadrupedLegs(side: WorkSide, work: LimbSpec): LimbPair {
  const kneel = kneelLeg(QUAD.hip);
  return side === 'near' ? { near: work, far: kneel } : { near: kneel, far: work };
}

export const quadrupedArms = { near: plantedArm(QUAD.wrist), far: plantedArm(QUAD.wristFar) };

/** A simple upright used only where the source tells the user to brace on a sturdy surface. */
export function supportProps(x: number, handY = 225): (pal: Palette) => Props {
  return (pal) => ({
    back: [
      { kind: 'box', nm: 'support-foot', color: pal.metalDark, c: [x, G - 4], s: [60, 8], r: 3 },
      { kind: 'box', nm: 'support-post', color: pal.prop, c: [x, 290], s: [20, 310], r: 4 },
      { kind: 'box', nm: 'support-handle', color: pal.metalDark, c: [x - 17, handY + 8], s: [7, 62], r: 3 },
    ],
  });
}

/** A low, sturdy post that anchors a resistance band behind the exerciser. */
export function lowAnchorProps(x: number): (pal: Palette) => Props {
  return (pal) => ({
    back: [
      { kind: 'box', nm: 'anchor-foot', color: pal.metalDark, c: [x, G - 4], s: [54, 8], r: 3 },
      { kind: 'box', nm: 'anchor-post', color: pal.prop, c: [x, 335], s: [18, 226], r: 4 },
      { kind: 'oval', nm: 'anchor-ring', color: pal.metal, c: [x + 11, STAND_ANKLE_Y], s: [18, 18] },
    ],
  });
}

/** The ankle cuff follows the active ankle of an alternating cable exercise. */
export function cableCuff(at: (J: Joints, t: number) => Vec2): RigidPart<Joints> {
  return {
    nm: 'Ankle Cuff', kind: 'rigid', z: 'front',
    shapes: (pal) => [
      { kind: 'oval', nm: 'cuff', color: pal.pad, c: [0, 0], s: [22, 14] },
      { kind: 'oval', nm: 'cuff-ring', color: pal.metalDark, c: [0, 0], s: [7, 7] },
    ],
    at: (J, t) => ({ p: at(J, t) }),
  };
}

export function alternatingAnkle(J: Joints, t: number): Vec2 {
  return alternate(t).side === 'near' ? J.ankle_n : J.ankle_f;
}
