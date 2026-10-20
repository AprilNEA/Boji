// Shared front-view poses for rear-delt-1. The stance remains planted and the trunk stays neutral unless a variant
// deliberately uses a hip hinge, seat or kneel. Fly motions keep the elbows soft and rows pull with high, wide elbows.
// The helpers use fixed cable pulleys and exact wrist targets so handles and bands follow the hands without IK stretch.
import type { FLimbSpec, FSide, FrontJoints, FrontPose } from '@/front-rig.ts';
import { toeDir } from '@/front-rig.ts';
import { add3, type Vec3 } from '@/math3.ts';
import { BODY } from '@/rig.ts';
import { frontGripAt, workTL } from '@/exercises/equipment/index.ts';

export const rearDeltTL = workTL(0.35);
export const sideSign = (side: FSide): number => side === 'l' ? 1 : -1;
export const SOFT_REACH = 122;

export type ArmFactory = (side: FSide, J: FrontJoints) => FLimbSpec;

export function standPose(arms: ArmFactory): FrontPose {
  return {
    pelvis: [0, BODY.ankleH + 183, 0],
    hips: { pitch: 3 },
    spine: { pitch: -2 },
    head: { pitch: -3 },
    legs: {
      l: { target: [17, BODY.ankleH, 2] },
      r: { target: [-17, BODY.ankleH, 2] },
    },
    arms: {
      l: { target: (J) => arms('l', J).target as Vec3, pole: (J) => arms('l', J).pole as Vec3, dir: (J) => arms('l', J).dir as Vec3 },
      r: { target: (J) => arms('r', J).target as Vec3, pole: (J) => arms('r', J).pole as Vec3, dir: (J) => arms('r', J).dir as Vec3 },
    },
  };
}

/** A hinged stance seen from the front: the pelvis stays over flat feet and the torso tips toward the viewer. */
export function hingePose(arms: ArmFactory): FrontPose {
  return {
    pelvis: [0, BODY.ankleH + 181, 0],
    hips: { pitch: 58 },
    spine: { pitch: 12 },
    neck: { pitch: -8 },
    head: { pitch: -8 },
    legs: {
      l: { target: [20, BODY.ankleH, 4] },
      r: { target: [-20, BODY.ankleH, 4] },
    },
    arms: {
      l: { target: (J) => arms('l', J).target as Vec3, pole: (J) => arms('l', J).pole as Vec3, dir: (J) => arms('l', J).dir as Vec3 },
      r: { target: (J) => arms('r', J).target as Vec3, pole: (J) => arms('r', J).pole as Vec3, dir: (J) => arms('r', J).dir as Vec3 },
    },
  };
}

/** Seated upright at the end of a flat bench. The shins stay vertical and the feet remain flat. */
export function seatPose(arms: ArmFactory): FrontPose {
  return {
    pelvis: [0, 123, 0],
    hips: { pitch: 3 },
    spine: { pitch: -2 },
    head: { pitch: -3 },
    legs: {
      l: { target: [33, BODY.ankleH, 66], dir: toeDir([0, 0, 1]) },
      r: { target: [-33, BODY.ankleH, 66], dir: toeDir([0, 0, 1]) },
    },
    arms: {
      l: { target: (J) => arms('l', J).target as Vec3, pole: (J) => arms('l', J).pole as Vec3, dir: (J) => arms('l', J).dir as Vec3 },
      r: { target: (J) => arms('r', J).target as Vec3, pole: (J) => arms('r', J).pole as Vec3, dir: (J) => arms('r', J).dir as Vec3 },
    },
  };
}

/** Kneeling upright, facing the cable station. Ankles remain grounded behind the knees. */
export function kneelPose(arms: ArmFactory): FrontPose {
  return {
    pelvis: [0, 116, 0],
    hips: { pitch: 4 },
    spine: { pitch: -2 },
    head: { pitch: -3 },
    legs: {
      l: { target: [24, BODY.ankleH, -72], dir: toeDir([0, 0, -1]) },
      r: { target: [-24, BODY.ankleH, -72], dir: toeDir([0, 0, -1]) },
    },
    arms: {
      l: { target: (J) => arms('l', J).target as Vec3, pole: (J) => arms('l', J).pole as Vec3, dir: (J) => arms('l', J).dir as Vec3 },
      r: { target: (J) => arms('r', J).target as Vec3, pole: (J) => arms('r', J).pole as Vec3, dir: (J) => arms('r', J).dir as Vec3 },
    },
  };
}

/** The handles begin in front of the shoulders and finish wide and slightly behind them. */
export function flyArm(p: number, side: FSide, J: FrontJoints, low = false): FLimbSpec {
  const s = sideSign(side);
  const start: Vec3 = low
    ? add3(J[`shoulder_${side}`], [s * 4, -116, 28])
    : add3(J[`shoulder_${side}`], [-s * 20, -2, 123]);
  const end = add3(J[`shoulder_${side}`], [s * 122, 0, -26]);
  return {
    target: [
      start[0] + (end[0] - start[0]) * p,
      start[1] + (end[1] - start[1]) * p,
      start[2] + (end[2] - start[2]) * p,
    ],
    pole: [s * 0.65, 0.05, -1],
  };
}

/** A rear-delt row keeps upper arms at shoulder height, then brings the hands toward the upper chest. */
export function rowArm(p: number, side: FSide, J: FrontJoints, neck = false): FLimbSpec {
  const s = sideSign(side);
  const start = add3(J[`shoulder_${side}`], [-s * 12, neck ? 12 : 2, 124]);
  const end = add3(J[`shoulder_${side}`], [s * (neck ? 52 : 68), neck ? 28 : 4, neck ? 74 : 72]);
  return {
    target: [
      start[0] + (end[0] - start[0]) * p,
      start[1] + (end[1] - start[1]) * p,
      start[2] + (end[2] - start[2]) * p,
    ],
    pole: [s * 0.9, 0.05, -1],
  };
}

/** Face-pull end position: hands by the ears and upper arms horizontal. */
export function facePullArm(p: number, side: FSide, J: FrontJoints): FLimbSpec {
  const s = sideSign(side);
  const start = add3(J[`shoulder_${side}`], [-s * 22, 0, 118]);
  const end = add3(J[`shoulder_${side}`], [s * 31, 7, 44]);
  return {
    target: [
      start[0] + (end[0] - start[0]) * p,
      start[1] + (end[1] - start[1]) * p,
      start[2] + (end[2] - start[2]) * p,
    ],
    pole: [s, 0, -1],
  };
}

/** Average screen grip position for a two-ended rope attachment. */
export const ropeGrip = (J: FrontJoints): [number, number] => {
  const l = frontGripAt(J, 'l'), r = frontGripAt(J, 'r');
  return [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2];
};

/** Visible rear-delt targets, with the deltoids primary and the trapezius secondary. */
export const rearDeltMuscles = [{ m: 'delts' as const }, { m: 'traps' as const, scale: 0.35 }];
