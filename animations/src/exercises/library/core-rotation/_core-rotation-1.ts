// Shared pose builders for the core-rotation-1 library exercises.
// This file keeps repeated supine geometry and alternating timing consistent.
import type { EquipmentTag, SideExercise } from '@/exercise.ts';
import { add, ang, dir, lerp, lerpV, mul, type Vec2 } from '@/math/vec2.ts';
import { timeline, type Timeline } from '@/math/timeline.ts';
import { BODY, type LimbSpec, type Pose } from '@/rig/side.ts';
import { A, FLOOR } from '@/exercises/common.ts';
import { bandCurve, bandLine } from '@/exercises/equipment/index.ts';

type Info = {
  id: string;
  name: string;
  en: string;
  equipment: EquipmentTag[];
  sources: string[];
};

const meta = (x: Info) => ({ en: x.en, family: 'core-rotation', equipment: x.equipment, sources: x.sources });

/** One controlled repetition on each side. Both half-cycles begin and end in the neutral pose. */
const HALF = timeline([
  { d: 0.8, from: 0, to: 1, e: [0.25, 1] },
  { d: 0.25, from: 1, to: 1, e: [1, 0.9] },
  { d: 0.9, from: 1, to: 0, e: [0.85, 0.3] },
  { d: 0.25, from: 0, to: 0, e: [0.3, 0.25] },
]);
export const alternatingTL: Timeline = { total: HALF.total * 2, at: (t) => HALF.at((t * 2) % 1) };
export const alternate = (t: number): { p: number; e: number; near: boolean } => ({ ...HALF.at((t * 2) % 1), near: t < 0.5 });

// Back on the mat. The neck base and hip match the established crunch and dead-bug contacts.
const NECK: Vec2 = [150, FLOOR - 18];
const HIP = add(NECK, mul(dir(-3.8), 123.7));
const FLAT = ang([NECK[0] - HIP[0], NECK[1] - HIP[1]]);
const ANKLE: Vec2 = [HIP[0] + 106, FLOOR - A];

const feetDown = (): { near: LimbSpec; far: LimbSpec } => ({
  near: { target: ANKLE, foot: 0, side: [0, -1] },
  far: { target: add(ANKLE, [-5, 0]), foot: 0, side: [0, -1] },
});
const tabletop = (offset = 0): LimbSpec => ({ a1: -90 + offset, a2: offset, foot: -84 + offset });
// q = 0 deliberately matches tabletop. This makes a left/right cycle close at its seam.
const longLeg = (q: number, offset = 0): LimbSpec => ({
  a1: lerp(-90, -8, q) + offset,
  a2: lerp(0, -8, q) + offset,
  foot: lerp(-84, -12, q) + offset,
});
const headArm = (q: number, active: boolean, offset = 0): LimbSpec => active
  ? { a1: lerp(-151, -106, q) + offset, a2: lerp(-97, -20, q) + offset, hand: lerp(-101, -20, q) + offset }
  : { a1: -151 + offset, a2: -97 + offset, hand: -101 + offset };

/** Supine bicycle: one knee stays in tabletop while the opposite leg reaches long and low. */
export function bicycleCrunch(info: Info, band = false): SideExercise {
  return {
    ...info, tl: alternatingTL, mat: true, meta: meta(info), poster: 0.14,
    muscles: [
      { m: 'abs' }, { m: 'obliques', scale: 0.65 },
      { m: 'hipFlexor', side: 'both', scale: 0.55 },
    ],
    ...(band ? { dynamic: [bandLine((J) => [J.ankle_n, J.ankle_f], 'underNearArm', 'Band around feet')] } : {}),
    pose(t): Pose {
      const { p, near } = alternate(t);
      const active = near ? 'near' : 'far';
      const passive = near ? 'far' : 'near';
      const legs = {
        [active]: longLeg(p),
        [passive]: tabletop(near ? 2 : 0),
      } as { near: LimbSpec; far: LimbSpec };
      return {
        hip: HIP,
        // A 31-degree thoracic curl raises the shoulder blade. The lumbar spine stays close to the mat.
        spine: { lumbar: FLAT - 1, thoracic: FLAT + 31 * p },
        neck: lerp(182, 218, p), head: lerp(181, 222, p), legs,
        // The active elbow travels toward the opposite tabletop knee. The other hand stays light behind the head.
        arms: near
          ? { near: headArm(0, false), far: headArm(p, true, 2) }
          : { near: headArm(p, true), far: headArm(0, false, 2) },
      };
    },
  } satisfies SideExercise;
}

export type CrossCrunchOptions = {
  liftKnee?: boolean;
  extendOther?: boolean;
  crossedLeg?: boolean;
  reachHand?: boolean;
};

/** Supine cross-body crunch. The chest curls before the elbow crosses; the neck does not pull the body up. */
export function crossCrunch(info: Info, opts: CrossCrunchOptions = {}): SideExercise {
  const oneSide = opts.crossedLeg === true;
  return {
    ...info, tl: oneSide ? HALF : alternatingTL, mat: true, meta: meta(info), poster: oneSide ? 0.34 : 0.14,
    muscles: [
      { m: 'abs' }, { m: 'obliques', scale: 0.7 },
      ...(opts.liftKnee || opts.extendOther ? [{ m: 'hipFlexor' as const, side: 'both' as const, scale: 0.45 }] : []),
    ],
    pose(t): Pose {
      // A figure-four crunch is normally completed on one side before changing sides.
      const { p, near } = oneSide ? { ...HALF.at(t), near: true } : alternate(t);
      let legs = feetDown();
      if (opts.crossedLeg) {
        // The far ankle rests across the near knee for a figure-four setup.
        legs = {
          near: { target: ANKLE, foot: 0, side: [0, -1] },
          far: { target: (J) => add(J.knee_n, [-4, -4]), foot: 18, side: [0, -1] },
        };
      } else if (opts.liftKnee) {
        const lifted: LimbSpec = {
          // At rest both feet remain planted. The working knee reaches the chest only during the curl.
          target: lerpV(ANKLE, [HIP[0] + 62, FLOOR - 103], p), foot: lerp(0, -20, p), side: [0, -1],
        };
        const extended = (offset = 0): LimbSpec => ({
          target: lerpV(ANKLE, [HIP[0] + 164, FLOOR - A - 28], p), foot: lerp(0, -8, p) + offset, side: [0, -1],
        });
        if (near) legs = { near: lifted, far: opts.extendOther ? extended(2) : feetDown().far };
        else legs = { near: opts.extendOther ? extended() : feetDown().near, far: lifted };
      }
      const activeArm = (offset = 0): LimbSpec => opts.reachHand
        // The forearm folds upward after the elbow drops toward the knee, so the hand never sweeps through the mat.
        ? { a1: lerp(-151, 24, p) + offset, a2: lerp(-97, -35, p) + offset, hand: lerp(-101, -35, p) + offset }
        : headArm(p, true, offset);
      return {
        hip: HIP,
        spine: { lumbar: FLAT - 1, thoracic: FLAT + 31 * p },
        neck: lerp(182, 218, p), head: lerp(181, 222, p), legs,
        arms: near
          ? { near: headArm(0, false), far: activeArm(2) }
          : { near: activeArm(), far: headArm(0, false, 2) },
      };
    },
  } satisfies SideExercise;
}

/** Joined-leg floor rotations: shoulders and arms stay pinned while the knees or straight legs sweep across. */
export function lyingWiper(info: Info, straight: boolean, isometric = false, startBent = false): SideExercise {
  const tl = timeline([
    { d: 0.85, from: 0, to: 1, e: [0.25, 0.9] },
    { d: isometric ? 0.8 : 0.25, from: 1, to: 1, e: [0.9, 1] },
    { d: 0.85, from: 1, to: 0, e: [0.85, 0.3] },
    { d: 0.25, from: 0, to: 0, e: [0.3, 0.25] },
  ]);
  const both = { total: tl.total * 2, at: (t: number) => tl.at((t * 2) % 1) };
  return {
    ...info, tl: both, mat: true, meta: meta(info), poster: isometric ? 0.22 : 0.12,
    muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.7 }, { m: 'hipFlexor', side: 'both', scale: 0.4 }],
    pose(t): Pose {
      const half = tl.at((t * 2) % 1), right = t < 0.5;
      const p = half.p;
      // The knees move together toward one shoulder. The forearms remain out to the sides as fixed shoulder anchors.
      const offset = (right ? 1 : -1) * 30 * p;
      const hip: Vec2 = add(HIP, [0, 0]);
      const leg: LimbSpec = straight
        ? { a1: -90 * p + offset, a2: -90 * p + offset, foot: -90 * p + offset }
        : { a1: -90 * p + offset, a2: offset, foot: offset };
      return {
        hip,
        spine: { lumbar: FLAT, thoracic: FLAT }, neck: 182, head: 181,
        legs: {
          near: startBent
            ? { target: lerpV(ANKLE, add(HIP, [70, -92]), p), foot: lerp(0, offset, p), side: [0, -1] }
            : leg,
          far: straight
            ? { a1: -90 * p + 2 + offset, a2: -90 * p + 2 + offset, foot: -90 * p + 2 + offset }
            : startBent
              ? { target: lerpV(add(ANKLE, [-5, 0]), add(HIP, [66, -92]), p), foot: lerp(0, 2 + offset, p), side: [0, -1] }
              : { a1: -90 * p + 2 + offset, a2: 2 + offset, foot: 2 + offset },
        },
        arms: {
          near: { a1: right ? -15 : 15, a2: right ? -4 : 4, hand: right ? -4 : 4 },
          far: { a1: right ? 15 : -15, a2: right ? 4 : -4, hand: right ? 4 : -4 },
        },
      };
    },
  } satisfies SideExercise;
}

const seatedTL = timeline([
  { d: 0.8, from: 0, to: 1, e: [0.3, 1] },
  { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
  { d: 0.9, from: 1, to: 0, e: [0.85, 0.35] },
  { d: 0.25, from: 0, to: 0, e: [0.35, 0.3] },
]);
const seatedAlternate: Timeline = { total: seatedTL.total * 2, at: (t) => seatedTL.at((t * 2) % 1) };

/** Seated torso rotation. The pelvis stays on the floor and the hands travel together across the body. */
export function seatedTwist(info: Info, opts: { extended?: boolean; handsHead?: boolean; liftedFeet?: boolean } = {}): SideExercise {
  const hip: Vec2 = [190, FLOOR - 16];
  const ankle: Vec2 = opts.extended ? [hip[0] + 180, FLOOR - A] : [hip[0] + 105, FLOOR - A];
  const legs = (): { near: LimbSpec; far: LimbSpec } => ({
    near: { target: ankle, foot: 0, side: [0, -1] },
    far: { target: add(ankle, [-4, 0]), foot: 0, side: [0, -1] },
  });
  return {
    ...info, tl: seatedAlternate, mat: true, meta: meta(info), poster: 0.13,
    muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.8 }, { m: 'lowerBack', scale: 0.35 }],
    ...(info.equipment.includes('band') ? {
      // The closed loop passes behind the waist and finishes in both hands.
      dynamic: [bandCurve((J) => [J.B(0.12), J.wrist_f, J.wrist_n, J.B(0.12), J.B(0.12)], 'underNearArm', 'Band around waist')],
    } : {}),
    pose(t): Pose {
      const h = seatedTL.at((t * 2) % 1), right = t < 0.5;
      const sway = (right ? 1 : -1) * 22 * h.p;
      const feet = legs();
      if (opts.liftedFeet) {
        feet.near = { target: add(ankle, [0, -30]), foot: -12, side: [0, -1] };
        feet.far = { target: add(ankle, [-4, -30]), foot: -12, side: [0, -1] };
      }
      return {
        hip,
        // Lean back slightly for Russian twists; otherwise keep a tall neutral spine.
        spine: { lumbar: opts.liftedFeet ? -105 : -91, thoracic: opts.liftedFeet ? -107 : -93 },
        neck: -94, head: -94, legs: feet,
        arms: opts.handsHead
          ? {
            near: { a1: -158 + sway, a2: -101 + sway, hand: -103 + sway },
            far: { a1: -156 + sway, a2: -99 + sway, hand: -101 + sway },
          }
          : {
            near: { a1: -35 + sway, a2: 15 + sway, hand: 15 + sway },
            far: { a1: -33 + sway, a2: 17 + sway, hand: 17 + sway },
          },
      };
    },
  } satisfies SideExercise;
}
