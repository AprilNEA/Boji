// Private builders for the vertical-press-2 exercise files. These keep the torso vertical,
// feet planted, and the pressing hand on its implement while each named variation keeps its own metadata.
import type { LibraryMeta, Props, PropShape, SideExercise } from '@/exercise.ts';
import { add, clamp, lerp, type Vec2 } from '@/math/vec2.ts';
import { smooth } from '@/math/timeline.ts';
import type { Palette } from '@/draw/palettes.ts';
import { BODY, type Joints, type LimbPair, type Pose } from '@/rig/side.ts';
import { A, ARM_STRAIGHT, G, handOnHip } from '@/exercises/common.ts';
import {
  BALL, ballShapes, dumbbell, ezBar, gripAt, kettlebell, landmine, place, workTL,
} from '@/exercises/equipment/index.ts';

export interface PressInfo {
  id: string;
  name: string;
  en: string;
  equipment: LibraryMeta['equipment'];
  sources: string[];
}

type Implement = 'dumbbell-forward' | 'dumbbell-neutral' | 'kettlebell';
type PressGrip = 'forward' | 'neutral' | 'reverse';

const STAND_X = 250;
const STAND_HIP_Y = G - A - (BODY.thigh + BODY.shin - 1);
const SEAT_HIP: Vec2 = [236, G - 104];
const SEAT_Y = G - 79;
const BALL_CENTER: Vec2 = [244, G - BALL.r];

const strictTL = workTL(0.32);
const strictProgress = (t: number): number => strictTL.at(t).p;
const effort = (t: number): number => 0.35 + 0.65 * Math.sin(Math.PI * strictProgress(t));

function meta(info: PressInfo) {
  return { en: info.en, family: 'vertical-press', equipment: info.equipment, sources: info.sources };
}

function standingLegs(nearX = STAND_X, farX = STAND_X): LimbPair {
  return {
    near: { target: [nearX, G - A], foot: 0, side: [1, 0] },
    far: { target: [farX, G - A], foot: 0, side: [1, 0] },
  };
}

function standingPose(arms: Pose['arms'], hipDrop = 0, nearX = STAND_X, farX = STAND_X): Pose {
  return {
    hip: [STAND_X, STAND_HIP_Y + hipDrop],
    spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: standingLegs(nearX, farX), arms,
  };
}

function benchProps(pal: Palette): Props {
  return {
    back: [
      { kind: 'box' as const, nm: 'bench-foot', color: pal.metalDark, c: [233, G - 4], s: [146, 8], r: 3 },
      { kind: 'box' as const, nm: 'bench-back-post', color: pal.metalDark, c: [191, 354], s: [10, 184], r: 3 },
      { kind: 'box' as const, nm: 'bench-seat-post', color: pal.metal, c: [246, 410], s: [10, 74], r: 3 },
      { kind: 'box' as const, nm: 'bench-backrest', color: pal.pad, c: [202, 278], s: [20, 172], r: 9, rot: 18 },
      { kind: 'box' as const, nm: 'bench-seat', color: pal.pad, c: [249, SEAT_Y + 7], s: [100, 16], r: 8 },
    ],
  };
}

function seatedPose(arms: Pose['arms']): Pose {
  return {
    hip: SEAT_HIP,
    spine: { lumbar: -93, thoracic: -95 }, neck: -90, head: -89,
    legs: {
      near: { target: [SEAT_HIP[0] + 100, G - A], foot: 0, side: [0, -1] },
      far: { target: [SEAT_HIP[0] + 94, G - A], foot: 0, side: [0, -1] },
    },
    arms,
  };
}

function ballPose(arms: Pose['arms']): Pose {
  return {
    hip: [244, G - 124],
    spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: {
      near: { target: [333, G - A], foot: 0, side: [1, 0] },
      far: { target: [326, G - A], foot: 0, side: [1, 0] },
    },
    arms,
  };
}

/** The racked hand stays far enough from the shoulder for a 90° elbow. */
function pressArm(p: number, side: 'near' | 'far', grip: PressGrip = 'forward', top = 1) {
  return {
    target: (J: Joints) => {
      const S = side === 'near' ? J.S : J.Sf;
      return add(S, [lerp(70, 2, p * top), lerp(-50, -ARM_STRAIGHT, p * top)]);
    },
    side: [1, 0.5] as Vec2,
    hand: grip === 'reverse' ? 90 : grip === 'neutral' ? -88 : -90,
  };
}

function inactiveHand(side: 'near' | 'far') {
  return side === 'near' ? handOnHip(0) : handOnHip(-4);
}

function weightParts(implement: Implement, both: boolean, rotation: (t: number) => number = strictProgress) {
  if (implement === 'dumbbell-forward') {
    return both ? [dumbbell('f', 'end'), dumbbell('n', 'end')] : [dumbbell('n', 'end')];
  }
  if (implement === 'dumbbell-neutral') {
    return both ? [dumbbell('f', 'profile'), dumbbell('n', 'profile')] : [dumbbell('n', 'profile')];
  }
  const bell = (side: 'n' | 'f') => kettlebell<Joints>((J, t) => ({
    p: gripAt(J, side), a: 180 * rotation(t),
  }), 'face', side === 'n' ? 'front' : 'overFarArm', side === 'n' ? 'Near Kettlebell' : 'Far Kettlebell');
  return both ? [bell('f'), bell('n')] : [bell('n')];
}

function basicMuscles(unilateral = false, legs = false) {
  return [
    { m: 'delts' as const, side: unilateral ? 'near' as const : 'both' as const, e: effort },
    { m: 'triceps' as const, side: unilateral ? 'near' as const : 'both' as const, scale: 0.55, e: effort },
    ...(legs ? [{ m: 'quads' as const, side: 'both' as const, scale: 0.45, e: effort }, { m: 'calves' as const, side: 'both' as const, scale: 0.3, e: effort }] : []),
  ];
}

export function seatedDumbbellPress(info: PressInfo, neutral = false, top = 1): SideExercise {
  const implement: Implement = neutral ? 'dumbbell-neutral' : 'dumbbell-forward';
  return {
    id: info.id, name: info.name, tl: strictTL, poster: 0.34, meta: meta(info),
    muscles: basicMuscles(), props: benchProps, propsBox: [150, 330], dynamic: weightParts(implement, true),
    pose: (t) => {
      const p = strictProgress(t);
      return seatedPose({ near: pressArm(p, 'near', neutral ? 'neutral' : 'forward', top), far: pressArm(p, 'far', neutral ? 'neutral' : 'forward', top) });
    },
  };
}

export function seatedSingleDumbbellPress(info: PressInfo, opts: { neutral?: boolean; reverse?: boolean } = {}): SideExercise {
  const neutral = opts.neutral ?? false, reverse = opts.reverse ?? false;
  return {
    id: info.id, name: info.name, tl: strictTL, poster: 0.34, meta: meta(info),
    muscles: basicMuscles(true), props: benchProps, propsBox: [150, 330], dynamic: weightParts(neutral || reverse ? 'dumbbell-neutral' : 'dumbbell-forward', false),
    pose: (t) => seatedPose({ near: pressArm(strictProgress(t), 'near', reverse ? 'reverse' : neutral ? 'neutral' : 'forward'), far: inactiveHand('far') }),
  };
}

export function ballSingleDumbbellPress(info: PressInfo, neutral = false): SideExercise {
  return {
    id: info.id, name: info.name, tl: strictTL, poster: 0.34, meta: meta(info),
    muscles: [...basicMuscles(true), { m: 'abs', scale: 0.35, e: effort }],
    props: (pal) => ({ back: place(ballShapes(pal), BALL_CENTER) }), propsBox: [BALL_CENTER[0] - BALL.r, BALL_CENTER[0] + BALL.r],
    dynamic: weightParts(neutral ? 'dumbbell-neutral' : 'dumbbell-forward', false),
    pose: (t) => ballPose({ near: pressArm(strictProgress(t), 'near', neutral ? 'neutral' : 'forward'), far: inactiveHand('far') }),
  };
}

function alternatingProgress(t: number, side: 'near' | 'far'): number {
  const u = t % 1;
  const a = side === 'near' ? u : (u + 0.5) % 1;
  return a < 0.25 ? smooth(a / 0.25) : a < 0.5 ? smooth(1 - (a - 0.25) / 0.25) : 0;
}

export function alternatingDumbbellPress(info: PressInfo, seated = false): SideExercise {
  const tl = { total: 3.4 };
  return {
    id: info.id, name: info.name, tl, poster: 0.25, meta: meta(info),
    muscles: [{ m: 'delts', side: 'both', e: (t) => 0.4 + 0.6 * Math.max(alternatingProgress(t, 'near'), alternatingProgress(t, 'far')) }, { m: 'triceps', side: 'both', scale: 0.55, e: (t) => 0.4 + 0.6 * Math.max(alternatingProgress(t, 'near'), alternatingProgress(t, 'far')) }],
    ...(seated ? { props: benchProps, propsBox: [150, 330] } : {}),
    dynamic: weightParts('dumbbell-forward', true),
    pose: (t) => {
      const arms = { near: pressArm(alternatingProgress(t, 'near'), 'near'), far: pressArm(alternatingProgress(t, 'far'), 'far') };
      return seated ? seatedPose(arms) : standingPose(arms);
    },
  };
}

export function standingDumbbellPress(info: PressInfo, opts: { neutral?: boolean; single?: boolean } = {}): SideExercise {
  const neutral = opts.neutral ?? false, single = opts.single ?? false;
  return {
    id: info.id, name: info.name, tl: strictTL, poster: 0.34, meta: meta(info), muscles: basicMuscles(single),
    dynamic: weightParts(neutral ? 'dumbbell-neutral' : 'dumbbell-forward', !single),
    pose: (t) => standingPose({ near: pressArm(strictProgress(t), 'near', neutral ? 'neutral' : 'forward'), far: single ? inactiveHand('far') : pressArm(strictProgress(t), 'far', neutral ? 'neutral' : 'forward') }),
  };
}

function kettlePose(pNear: number, pFar: number, hipDrop = 0, split = 0, single = false): Pose {
  const legs = split > 0
    ? standingLegs(STAND_X + 42 * split, STAND_X - 42 * split)
    : standingLegs();
  return {
    hip: [STAND_X, STAND_HIP_Y + hipDrop], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, legs,
    arms: { near: pressArm(pNear, 'near'), far: single ? inactiveHand('far') : pressArm(pFar, 'far') },
  };
}

export function standingKettlebellPress(info: PressInfo, opts: { single?: boolean; arnold?: boolean } = {}): SideExercise {
  const single = opts.single ?? false;
  return {
    id: info.id, name: info.name, tl: strictTL, poster: 0.34, meta: meta(info), muscles: basicMuscles(single),
    dynamic: weightParts('kettlebell', !single, opts.arnold ? strictProgress : strictProgress),
    pose: (t) => {
      const p = strictProgress(t);
      const near = pressArm(p, 'near', opts.arnold ? 'neutral' : 'forward');
      if (single) return standingPose({ near, far: inactiveHand('far') });
      return standingPose({ near, far: pressArm(p, 'far') });
    },
  };
}

export function seatedKettlebellPress(info: PressInfo): SideExercise {
  return {
    id: info.id, name: info.name, tl: strictTL, poster: 0.34, meta: meta(info), muscles: basicMuscles(), props: benchProps, propsBox: [150, 330],
    dynamic: weightParts('kettlebell', true),
    pose: (t) => {
      const p = strictProgress(t);
      return seatedPose({ near: pressArm(p, 'near'), far: pressArm(p, 'far') });
    },
  };
}

export function floorKettlebellPress(info: PressInfo): SideExercise {
  return {
    id: info.id, name: info.name, tl: strictTL, poster: 0.34, meta: meta(info), mat: true, muscles: basicMuscles(true),
    dynamic: weightParts('kettlebell', false),
    pose: (t) => ({
      hip: [215, G - 36], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
      legs: { near: { a1: 15, a2: -1, foot: 0 }, far: { a1: 9, a2: -2, foot: 0 } },
      arms: { near: pressArm(strictProgress(t), 'near'), far: inactiveHand('far') },
    }),
  };
}

export function alternatingKettlebellPress(info: PressInfo, seesaw = false): SideExercise {
  const tl = { total: 3.4 };
  const near = (t: number) => seesaw ? (1 - Math.cos(Math.PI * 2 * t)) / 2 : alternatingProgress(t, 'near');
  const far = (t: number) => seesaw ? 1 - near(t) : alternatingProgress(t, 'far');
  return {
    id: info.id, name: info.name, tl, poster: seesaw ? 0 : 0.25, meta: meta(info),
    muscles: [{ m: 'delts', side: 'both', e: (t) => 0.45 + 0.55 * Math.max(near(t), far(t)) }, { m: 'triceps', side: 'both', scale: 0.55, e: (t) => 0.45 + 0.55 * Math.max(near(t), far(t)) }],
    dynamic: weightParts('kettlebell', true, (t) => Math.max(near(t), far(t))),
    pose: (t) => kettlePose(near(t), far(t)),
  };
}

const phase = (t: number, a: number, b: number): number => smooth(clamp((t - a) / (b - a), 0, 1));
const pushPress = (t: number): number => t < 0.15 ? 0 : t < 0.45 ? phase(t, 0.15, 0.45) : t < 0.58 ? 1 : t < 0.94 ? 1 - phase(t, 0.58, 0.94) : 0;
const dip = (t: number): number => t < 0.15 ? phase(t, 0, 0.15) : t < 0.29 ? 1 - phase(t, 0.15, 0.29) : 0;

export function kettlebellPushPress(info: PressInfo, single = false): SideExercise {
  const tl = { total: 3.4 };
  return {
    id: info.id, name: info.name, tl, poster: 0.51, meta: meta(info), muscles: basicMuscles(single, true),
    dynamic: weightParts('kettlebell', !single, pushPress),
    pose: (t) => {
      const p = pushPress(t), d = 18 * dip(t);
      const arms = { near: pressArm(p, 'near'), far: single ? inactiveHand('far') : pressArm(p, 'far') };
      return standingPose(arms, d);
    },
  };
}

const jerkPress = (t: number): number => t < 0.14 ? 0 : t < 0.42 ? phase(t, 0.14, 0.42) : t < 0.68 ? 1 : t < 0.95 ? 1 - phase(t, 0.68, 0.95) : 0;
const jerkCatch = (t: number): number => t < 0.32 ? 0 : t < 0.46 ? phase(t, 0.32, 0.46) : t < 0.62 ? 1 - phase(t, 0.46, 0.62) : 0;

export function kettlebellJerk(info: PressInfo, split = false): SideExercise {
  const tl = { total: 3.5 };
  return {
    id: info.id, name: info.name, tl, poster: 0.52, meta: meta(info), muscles: basicMuscles(true, true),
    dynamic: weightParts('kettlebell', false, jerkPress),
    pose: (t) => {
      const c = jerkCatch(t), p = jerkPress(t);
      if (split) return kettlePose(p, 0, 40 * c, c, true);
      return standingPose({ near: pressArm(p, 'near'), far: inactiveHand('far') }, 40 * c);
    },
  };
}

export function ezBarPress(info: PressInfo): SideExercise {
  return {
    id: info.id, name: info.name, tl: strictTL, poster: 0.34, meta: meta(info), muscles: basicMuscles(),
    dynamic: [ezBar<Joints>({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t) => standingPose({ near: pressArm(strictProgress(t), 'near'), far: pressArm(strictProgress(t), 'far') }),
  };
}

export function landminePushPress(info: PressInfo): SideExercise {
  const tl = { total: 3.4 };
  const pivot: Vec2 = [128, G - 7];
  const lm = landmine<Joints>(pivot, (J) => gripAt(J, 'n'), 'side', 48, 'medium');
  return {
    id: info.id, name: info.name, tl, poster: 0.51, meta: meta(info), muscles: basicMuscles(true, true),
    props: (pal) => ({ back: lm.base(pal) }), propsBox: [112, 356], dynamic: lm.parts,
    pose: (t) => standingPose({ near: pressArm(pushPress(t), 'near'), far: inactiveHand('far') }, 18 * dip(t)),
  };
}

function machineProps(pal: Palette, smith = false): Props {
  const bars: PropShape[] = smith
    ? [
      { kind: 'box' as const, nm: 'smith-rail-front', color: pal.metalDark, c: [284, 236], s: [10, 352], r: 4 },
      { kind: 'box' as const, nm: 'smith-rail-back', color: pal.metal, c: [166, 236], s: [10, 352], r: 4 },
      { kind: 'box' as const, nm: 'smith-top', color: pal.metalDark, c: [225, 62], s: [132, 10], r: 3 },
    ]
    : [
      { kind: 'box' as const, nm: 'machine-upright', color: pal.metalDark, c: [155, 250], s: [14, 360], r: 5 },
      { kind: 'box' as const, nm: 'machine-top', color: pal.metal, c: [193, 82], s: [94, 12], r: 4 },
      { kind: 'box' as const, nm: 'machine-base', color: pal.metalDark, c: [202, G - 4], s: [174, 8], r: 3 },
    ];
  const stack: PropShape[] = [
    { kind: 'box', nm: 'weight-stack', color: pal.plate, c: [135, 332], s: [42, 172], r: 4 },
    { kind: 'box', nm: 'weight-stack-cap', color: pal.metal, c: [135, 245], s: [58, 12], r: 3 },
  ];
  return {
    back: [
      ...(benchProps(pal).back ?? []),
      ...bars,
      ...(smith ? [] : stack),
    ],
  };
}

function machineArms(p: number, single: boolean) {
  return { near: pressArm(p, 'near'), far: single ? inactiveHand('far') : pressArm(p, 'far') };
}

function leverParts(single: boolean) {
  const root: Vec2 = [165, 143];
  const arm = (side: 'n' | 'f') => ({
    nm: side === 'n' ? 'Near Press Lever' : 'Far Press Lever', kind: 'line' as const, z: side === 'n' ? 'underNearArm' as const : 'overFarArm' as const,
    width: 10, color: (pal: Palette) => pal.metal,
    at: (J: Joints) => [root, gripAt(J, side)] as [Vec2, Vec2],
  });
  return single ? [arm('n')] : [arm('f'), arm('n')];
}

export function machinePress(info: PressInfo, single = false): SideExercise {
  return {
    id: info.id, name: info.name, tl: strictTL, poster: 0.34, meta: meta(info), muscles: basicMuscles(single),
    props: (pal) => machineProps(pal), propsBox: [95, 340], dynamic: leverParts(single),
    pose: (t) => seatedPose(machineArms(strictProgress(t), single)),
  };
}

export function smithPress(info: PressInfo, opts: { standing?: boolean; behindNeck?: boolean } = {}): SideExercise {
  const standing = opts.standing ?? false, behind = opts.behindNeck ?? false;
  const arm = (p: number, side: 'near' | 'far') => ({
    target: (J: Joints) => {
      const S = side === 'near' ? J.S : J.Sf;
      // The hand moves vertically on the rail from a bent-elbow rack to a soft lockout.
      return add(S, [behind ? -20 : 20, lerp(-75, -124, p)]);
    }, side: [1, 0.5] as Vec2, hand: -90,
  });
  return {
    id: info.id, name: info.name, tl: strictTL, poster: 0.34, meta: meta(info), muscles: basicMuscles(),
    props: (pal) => machineProps(pal, true), propsBox: [140, 306],
    dynamic: [ezBar<Joints>({ view: 'side', nm: 'Smith Bar', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t) => {
      const p = strictProgress(t);
      const arms = { near: arm(p, 'near'), far: arm(p, 'far') };
      return standing ? standingPose(arms) : seatedPose(arms);
    },
  };
}
