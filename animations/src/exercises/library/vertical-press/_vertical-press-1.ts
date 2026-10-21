// Shared builders for vertical-press-1. Side presses keep the feet planted and use one vertical hand path.
// Front presses show bilateral or alternating arm paths in the frontal plane. Seated poses retain bench contact.
// The helper keeps the different implements attached to the hands, cables attached to low pulleys, and bands under feet.
import type { FrontExercise, LibraryMeta, MovingPart, Props, SideExercise } from '@/exercise.ts';
import { add, lerp, lerpV, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { add3, lerp3, type Vec3 } from '@/math/vec3.ts';
import type { Palette } from '@/draw/palettes.ts';
import { BODY, type Joints, type Pose } from '@/rig/side.ts';
import { project, type FrontJoints, type FrontPose } from '@/rig/front.ts';
import { A, ARM_STRAIGHT, G, standLegs } from '@/exercises/common.ts';
import {
  bandLine,
  barbell,
  cableColumn,
  cableHandle,
  cableLine,
  dumbbell,
  frontDumbbell,
  frontGripAt,
  gripAt,
  inclineBench,
  kettlebell,
  workTL,
} from '@/exercises/equipment/index.ts';

export type PressMeta = Pick<LibraryMeta, 'en' | 'equipment' | 'sources'>;
/** Backward-compatible local alias for the thin exercise files in this work list. */
export type PressInfo = PressMeta;
type SideImplement = 'barbell' | 'dumbbell' | 'band' | 'cable';
type FrontImplement = 'dumbbell' | 'kettlebell' | 'barbell' | 'band';
const FRONT_TRICEPS = { view: 'front' as const, part: 'upper' as const, c: [0, 35] as Vec2, s: [11, 29] as Vec2 };

const SIDE_TL = workTL(0.3);
const FRONT_TL = workTL(0.3);
const PUSH_TL = timeline([
  { d: 0.20, from: 0, to: 0, e: [0.35, 0.55] },
  { d: 0.70, from: 0, to: 1, e: [0.55, 1] },
  { d: 0.30, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.35, from: 1, to: 0, e: [0.85, 0.4] },
  { d: 0.35, from: 0, to: 0, e: [0.4, 0.3] },
]);
const ALT_TL = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.4, 1] }, { d: 0.25, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.45, from: 1, to: 0, e: [0.85, 0.4] }, { d: 0.25, from: 0, to: 0, e: [0.4, 0.3] },
  { d: 1.0, from: 0, to: 1, e: [0.4, 1] }, { d: 0.25, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.45, from: 1, to: 0, e: [0.85, 0.4] }, { d: 0.25, from: 0, to: 0, e: [0.4, 0.3] },
]);
// The 0.1 px slack keeps a tall, straight standing position without reach warnings.
const SIDE_HIP: Vec2 = [250, G - A - BODY.thigh - BODY.shin + 0.1];
const SEAT_HIP: Vec2 = [250, G - 104];
const UPRIGHT_BENCH = inclineBench({ x: 230, angle: 90, top: 100, back: 156, seat: 105, facing: 1 });
const INCLINE_BENCH = inclineBench({ x: 230, angle: 72, top: 100, back: 166, seat: 105, facing: 1 });
const CABLE_TOWER = cableColumn({ x: 118, pulleyY: G - 48, toward: 1, top: 46 });

const seatedLegs = {
  near: { target: [350, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
  far: { target: [344, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
};

function sideBase(seated: boolean, incline: boolean, dip = 0): Omit<Pose, 'arms'> {
  const hip = seated ? SEAT_HIP : [SIDE_HIP[0], SIDE_HIP[1] + dip] as Vec2;
  const lean = incline ? -108 : -90;
  return {
    hip,
    spine: { lumbar: lean, thoracic: lean },
    neck: lean,
    head: lean,
    legs: seated ? seatedLegs : standLegs(SIDE_HIP[0], 0),
  };
}

function sideArms(near: number, far: number, rear = false): Pose['arms'] {
  // The racked hand keeps an 85 to 90 degree elbow instead of folding against the face.
  const bottom: Vec2 = rear ? [-78, 26] : [82, 26];
  const top: Vec2 = rear ? [-2, -125.7] : [2, -125.7];
  const arm = (p: number, which: 'near' | 'far') => ({
    target: (J: Joints) => add(J[which === 'near' ? 'S' : 'Sf'], lerpV(bottom, top, p)),
    side: [1, 0] as Vec2,
    hand: -90,
  });
  return { near: arm(near, 'near'), far: arm(far, 'far') };
}

function sideEquipment(implement: SideImplement): MovingPart<Joints>[] {
  switch (implement) {
    case 'barbell':
      return [barbell<Joints>({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })];
    case 'dumbbell':
      return [dumbbell('f', 'end'), dumbbell('n', 'end')];
    case 'band':
      return [
        bandLine<Joints>((J) => [[J.ankle_n[0], G - 4], gripAt(J, 'n')], 'underNearArm', 'Near resistance band'),
        bandLine<Joints>((J) => [[J.ankle_f[0] - 4, G - 4], gripAt(J, 'f')], 'overFarArm', 'Far resistance band'),
      ];
    case 'cable':
      return [
        cableLine<Joints>(CABLE_TOWER.pulley, (J) => gripAt(J, 'n'), 'Near low cable'),
        cableLine<Joints>(CABLE_TOWER.pulley, (J) => gripAt(J, 'f'), 'Far low cable'),
        cableHandle<Joints>('d', (J) => ({ p: gripAt(J, 'n') }), { z: 'underNearArm' }),
        cableHandle<Joints>('d', (J) => ({ p: gripAt(J, 'f') }), { z: 'overFarArm' }),
      ];
  }
}

function sideProps(seated: boolean, incline: boolean, cable: boolean): (pal: Palette) => Props {
  return (pal) => {
    const back = [
      ...(seated ? (incline ? INCLINE_BENCH : UPRIGHT_BENCH).draw(pal) : []),
      ...(cable ? CABLE_TOWER.draw(pal) : []),
    ];
    return { back };
  };
}

function pushDip(t: number): number {
  const q = t * PUSH_TL.total;
  if (q <= 0.20) return 14 * (q / 0.20);
  if (q <= 0.42) return 14 * (1 - (q - 0.20) / 0.22);
  return 0;
}

export function sidePress({
  id, name, meta, implement, seated = false, incline = false, rear = false, push = false,
}: {
  id: string;
  name: string;
  meta: PressMeta;
  implement: SideImplement;
  seated?: boolean;
  incline?: boolean;
  rear?: boolean;
  push?: boolean;
}): SideExercise {
  return {
    id,
    name,
    tl: push ? PUSH_TL : SIDE_TL,
    meta: { ...meta, family: 'vertical-press' },
    muscles: [
      { m: 'delts', side: 'both' },
      { m: 'triceps', side: 'both', scale: 0.55 },
      ...(push ? [{ m: 'quads' as const, side: 'both' as const, scale: 0.35 }] : []),
    ],
    props: sideProps(seated, incline, implement === 'cable'),
    propsBox: implement === 'cable' ? [CABLE_TOWER.box[0], 360] : seated ? (incline ? INCLINE_BENCH.box : UPRIGHT_BENCH.box) : undefined,
    dynamic: sideEquipment(implement),
    pose(t) {
      const p = (push ? PUSH_TL : SIDE_TL).at(t).p;
      // The dip ends as the bar begins to rise. Both feet remain fixed on the floor.
      const dip = push ? pushDip(t) : 0;
      return { ...sideBase(seated, incline, dip), arms: sideArms(p, p, rear) };
    },
  };
}

const BRADFORD_TL = timeline([
  { d: 0.9, from: 0, to: 1, e: [0.45, 0.9] },
  { d: 0.9, from: 1, to: 0, e: [0.9, 0.55] },
  { d: 0.9, from: 0, to: 1, e: [0.55, 0.9] },
  { d: 0.9, from: 1, to: 0, e: [0.9, 0.45] },
]);

function bradfordPath(t: number): { p: number; rear: boolean } {
  const q = (t + 0.00001) % 1;
  if (q < 0.25) return { p: q * 4, rear: false };
  if (q < 0.5) return { p: 1 - (q - 0.25) * 4, rear: true };
  if (q < 0.75) return { p: (q - 0.5) * 4, rear: true };
  return { p: 1 - (q - 0.75) * 4, rear: false };
}

export function bradfordPress({ id, name, meta, seated }: { id: string; name: string; meta: PressMeta; seated: boolean }): SideExercise {
  return {
    id,
    name,
    tl: BRADFORD_TL,
    meta: { ...meta, family: 'vertical-press' },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.5 }],
    props: sideProps(seated, false, false),
    propsBox: seated ? UPRIGHT_BENCH.box : undefined,
    dynamic: [barbell<Joints>({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
    poster: 0.125,
    pose(t) {
      const a = bradfordPath(t);
      return { ...sideBase(seated, false), arms: sideArms(a.p, a.p, a.rear) };
    },
  };
}

/** Complete one controlled press, then leave both hands racked before the other side begins. */
function alternatingProgress(t: number): [number, number] {
  const q = t * ALT_TL.total;
  const onePress = (u: number): number => {
    if (u <= 0) return 0;
    if (u < 1.0) return u;
    if (u < 1.25) return 1;
    if (u < 2.70) return 1 - (u - 1.25) / 1.45;
    return 0;
  };
  return [onePress(q), onePress(q - 2.95)];
}

/** Seated alternating press: one dumbbell reaches lockout while the other remains at shoulder height. */
export function sideAlternatingNeutralPress({ id, name, meta }: { id: string; name: string; meta: PressMeta }): SideExercise {
  return {
    id,
    name,
    tl: ALT_TL,
    meta: { ...meta, family: 'vertical-press' },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.55 }],
    props: sideProps(true, false, false),
    propsBox: UPRIGHT_BENCH.box,
    dynamic: [dumbbell('f', 'profile'), dumbbell('n', 'profile')],
    pose(t) {
      const [near, far] = alternatingProgress(t);
      return { ...sideBase(true, false), arms: sideArms(near, far) };
    },
  };
}

/** Standing alternating cable press: both D-handles stay connected to their low pulley path. */
export function sideAlternatingCablePress({ id, name, meta }: { id: string; name: string; meta: PressMeta }): SideExercise {
  return {
    id,
    name,
    tl: ALT_TL,
    meta: { ...meta, family: 'vertical-press' },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.55 }],
    props: sideProps(false, false, true),
    propsBox: [CABLE_TOWER.box[0], 360],
    dynamic: sideEquipment('cable'),
    pose(t) {
      const [near, far] = alternatingProgress(t);
      return { ...sideBase(false, false), arms: sideArms(near, far) };
    },
  };
}

function frontLegs(): FrontPose['legs'] {
  return {
    l: { target: [34, BODY.ankleH, 2] },
    r: { target: [-34, BODY.ankleH, 2] },
  };
}

type FrontPressStyle = 'standard' | 'arnold' | 'wide' | 'close' | 'rear' | 'side' | 'para' | 'side-military';

function frontPressPath(style: FrontPressStyle, sign: number): { bottom: Vec3; top: Vec3 } {
  const standard = { bottom: [sign * 78, 20, 36] as Vec3, top: [sign * 2, 125.75, 0] as Vec3 };
  switch (style) {
    // Arnold presses begin with the hands close and forward, then arc out while the palms rotate.
    case 'arnold': return { bottom: [sign * 46, 18, 72], top: standard.top };
    // Front view makes the specified close and wide grips readable instead of hiding both behind one plate.
    case 'wide': return { bottom: [sign * 87, 16, 20], top: [sign * 28, 122.8, 0] };
    case 'close': return { bottom: [sign * 55, 18, 67], top: [sign * 8, 125.5, 0] };
    // The rack position is behind the head and the bar stays behind the face until the overhead position.
    case 'rear': return { bottom: [sign * 75, 18, -44], top: [sign * 2, 125.55, -8] };
    // The two single-arm side presses visibly use different overhead paths.
    case 'side': return { bottom: [sign * 84, 18, 20], top: [sign * 24, 123.7, 0] };
    case 'para': return { bottom: [sign * 84, 18, 20], top: [sign * 42, 118.8, 0] };
    case 'side-military': return { bottom: [sign * 52, 18, 68], top: [sign * 42, 118.8, 0] };
    default: return standard;
  }
}

function frontSeatProps(pal: Palette): Props {
  return {
    back: [
      { kind: 'box', nm: 'bench-foot', color: pal.metalDark, c: [0, G - 4], s: [150, 8], r: 3 },
      { kind: 'box', nm: 'bench-post', color: pal.metalDark, c: [0, G - 58], s: [10, 90], r: 3 },
      { kind: 'box', nm: 'bench-seat', color: pal.pad, c: [0, G - 96], s: [100, 16], r: 7 },
      { kind: 'box', nm: 'bench-back', color: pal.padFar, c: [0, G - 166], s: [22, 148], r: 9 },
    ],
  };
}

function frontPose(left: number, right: number, seated: boolean, roll = 0, yaw = 0, style: FrontPressStyle = 'standard'): FrontPose {
  // Standing ankles sit 17 px wider than their hip joints, so leave enough leg slack for that stance.
  const lower = seated ? BODY.ankleH + 100 : BODY.ankleH + BODY.thigh + BODY.shin - 0.9;
  const leg = seated
    ? {
        l: { target: [52, BODY.ankleH, 2] as Vec3 },
        r: { target: [-52, BODY.ankleH, 2] as Vec3 },
      }
    : frontLegs();
  const arm = (p: number, side: 'l' | 'r') => ({
    target: (J: FrontJoints) => {
      const sign = side === 'l' ? 1 : -1;
      const { bottom, top } = frontPressPath(style, sign);
      return add3(J[`shoulder_${side}`], [
        lerp(bottom[0], top[0], p),
        lerp(bottom[1], top[1], p),
        lerp(bottom[2], top[2], p),
      ]);
    },
    pole: [side === 'l' ? 0.45 : -0.45, -0.4, -0.85] as Vec3,
  });
  return {
    pelvis: [0, lower, 0],
    spine: { roll, yaw },
    neck: { roll: -roll * 0.2 },
    head: { roll: -roll * 0.35, yaw: -yaw * 0.25 },
    legs: leg,
    arms: { l: arm(left, 'l'), r: arm(right, 'r') },
    shoulders: { l: { up: 5 * left }, r: { up: 5 * right } },
  };
}

function frontEquipment(implement: FrontImplement, rearBar = false, only?: 'l' | 'r'): MovingPart<FrontJoints>[] {
  switch (implement) {
    case 'dumbbell':
      return only ? [frontDumbbell(only, 'profile')] : [frontDumbbell('l', 'profile'), frontDumbbell('r', 'profile')];
    case 'kettlebell':
      return (only ? [only] : ['l', 'r'] as const).map((side) =>
        kettlebell<FrontJoints>((J) => ({ p: frontGripAt(J, side) }), 'face', 'front', `${side === 'l' ? 'Left' : 'Right'} kettlebell`),
      );
    case 'barbell':
      return [barbell<FrontJoints>({
        view: 'front', plate: 'medium', z: rearBar ? 'back' : 'underNearArm',
        at: (J) => {
          const l = frontGripAt(J, 'l'), r = frontGripAt(J, 'r');
          return { p: [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2] };
        },
      })];
    case 'band':
      return [
        bandLine<FrontJoints>((J) => [project(J.ankle_l), frontGripAt(J, 'l')], 'underNearArm', 'Left resistance band'),
        bandLine<FrontJoints>((J) => [project(J.ankle_r), frontGripAt(J, 'r')], 'underNearArm', 'Right resistance band'),
      ];
  }
}

export function frontPress({
  id, name, meta, implement, seated = false, rearBar = false, alternating = false, twisting = false, unilateral, style = 'standard',
}: {
  id: string;
  name: string;
  meta: PressMeta;
  implement: FrontImplement;
  seated?: boolean;
  rearBar?: boolean;
  alternating?: boolean;
  twisting?: boolean;
  unilateral?: 'l' | 'r';
  style?: FrontPressStyle;
}): FrontExercise {
  return {
    id,
    name,
    view: 'front',
    tl: alternating ? ALT_TL : FRONT_TL,
    meta: { ...meta, family: 'vertical-press' },
    muscles: [
      { m: 'delts', side: 'both' },
      { m: 'triceps', side: 'both', scale: 0.55, region: FRONT_TRICEPS },
      ...(twisting ? [{ m: 'obliques' as const, scale: 0.45 }] : []),
    ],
    props: seated ? frontSeatProps : undefined,
    propsBox: seated ? [-75, 75] : undefined,
    dynamic: frontEquipment(implement, rearBar, unilateral),
    pose(t) {
      const p = (alternating ? ALT_TL : FRONT_TL).at(t).p;
      const path = rearBar && style === 'standard' ? 'rear' : style;
      if (alternating) {
        const [left, right] = alternatingProgress(t);
        // The Arnold variation leans away from the arm at lockout while the hips remain centered.
        return frontPose(left, right, seated, twisting ? 13 * (right - left) : 0, 0, path);
      }
      const pose = frontPose(unilateral === 'r' ? 0 : p, unilateral === 'l' ? 0 : p, seated, 0, twisting ? 18 * Math.sin(Math.PI * 2 * t) : 0, path);
      if (!unilateral) return pose;
      // The free arm stays relaxed at the side instead of pretending to hold a second implement.
      const free = unilateral === 'l' ? 'r' : 'l';
      const sign = free === 'l' ? 1 : -1;
      return {
        ...pose,
        arms: {
          ...pose.arms,
          [free]: {
            target: (J: FrontJoints) => add3(J[`shoulder_${free}`], [sign * 18, -112, 4]),
            pole: [sign * 0.2, -0.4, -0.85] as Vec3,
          },
        },
      };
    },
  };
}

export function frontWPress({ id, name, meta }: { id: string; name: string; meta: PressMeta }): FrontExercise {
  const tl = workTL(0.3);
  return {
    id,
    name,
    view: 'front',
    tl,
    meta: { ...meta, family: 'vertical-press' },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.55, region: FRONT_TRICEPS }, { m: 'pecs', scale: 0.3 }],
    props: frontSeatProps,
    propsBox: [-75, 75],
    dynamic: [frontDumbbell('l', 'profile'), frontDumbbell('r', 'profile')],
    pose(t) {
      const p = tl.at(t).p;
      const base = frontPose(p, p, true);
      const arm = (side: 'l' | 'r') => ({
        target: (J: FrontJoints) => {
          const sign = side === 'l' ? 1 : -1;
          const bottom: Vec3 = [sign * 85, 20, 20];
          const top: Vec3 = [sign * 2, 125.75, 0];
          return add3(J[`shoulder_${side}`], [
            lerp(bottom[0], top[0], p),
            lerp(bottom[1], top[1], p),
            lerp(bottom[2], top[2], p),
          ]);
        },
        pole: [side === 'l' ? 0.75 : -0.75, -0.35, -0.75] as Vec3,
      });
      return { ...base, arms: { l: arm('l'), r: arm('r') } };
    },
  };
}

/** Bilateral band presses alternate a left and right ribcage rotation, with the pelvis and feet fixed. */
export function twistingBandPress({ id, name, meta }: { id: string; name: string; meta: PressMeta }): FrontExercise {
  const onePress = (u: number): number => {
    if (u <= 0) return 0;
    if (u < 1.0) return u;
    if (u < 1.25) return 1;
    if (u < 2.70) return 1 - (u - 1.25) / 1.45;
    return 0;
  };
  return {
    id, name, view: 'front', tl: ALT_TL,
    meta: { ...meta, family: 'vertical-press' },
    muscles: [
      { m: 'delts', side: 'both' },
      { m: 'triceps', side: 'both', scale: 0.55, region: FRONT_TRICEPS },
      { m: 'obliques', scale: 0.45 },
    ],
    dynamic: frontEquipment('band'),
    pose(t) {
      const q = t * ALT_TL.total;
      const first = q < 2.95;
      const p = onePress(first ? q : q - 2.95);
      return frontPose(p, p, false, 0, (first ? 18 : -18) * p);
    },
  };
}

/** A face-down incline press keeps the torso on the pad while the bar travels horizontally forward from the chest. */
export function antiGravityPress({ id, name, meta }: { id: string; name: string; meta: PressMeta }): SideExercise {
  const bench = inclineBench({ x: 242, angle: 45, facing: -1 });
  const base: Omit<Pose, 'arms'> = {
    hip: [244, G - 111], spine: { lumbar: -46, thoracic: -45 }, neck: -44, head: -43,
    legs: { near: { a1: 35, a2: 16, foot: 0 }, far: { a1: 35, a2: 16, foot: 0 } },
  };
  return {
    id, name, tl: SIDE_TL,
    meta: { ...meta, family: 'vertical-press' },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'traps', scale: 0.35 }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [barbell<Joints>({ view: 'side', plate: 'small', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose(t) {
      const p = SIDE_TL.at(t).p;
      const arm = (far: boolean) => ({
        target: (J: Joints) => add(far ? J.Sf : J.S, lerpV([62, 42], [ARM_STRAIGHT, 0], p)),
        side: [1, 1] as Vec2, hand: 0,
      });
      return { ...base, arms: { near: arm(false), far: arm(true) } };
    },
  };
}

/** The bell stays vertical while the lifter bends away and plants the free hand beside the lead foot. */
export function frontBentPress({ id, name, meta }: { id: string; name: string; meta: PressMeta }): FrontExercise {
  return {
    id, name, view: 'front', tl: FRONT_TL,
    meta: { ...meta, family: 'vertical-press' },
    muscles: [
      { m: 'obliques', scale: 1 }, { m: 'delts', scale: 0.65 }, { m: 'triceps', scale: 0.45, region: FRONT_TRICEPS },
      { m: 'quads', scale: 0.3 },
    ],
    dynamic: [kettlebell<FrontJoints>((J) => ({ p: frontGripAt(J, 'r') }), 'face', 'front', 'Right kettlebell')],
    pose(t) {
      const p = FRONT_TL.at(t).p;
      const roll = 38 * p;
      return {
        pelvis: lerp3([0, 194, 0], [15, 40, 0], p),
        spine: { roll, yaw: -12 * p },
        neck: { roll: -roll * 0.18, yaw: 12 * p },
        head: { roll: -roll * 0.3, yaw: 25 * p },
        legs: {
          l: { target: [30, BODY.ankleH, 2] },
          r: { target: [-30, BODY.ankleH, 2] },
        },
        arms: {
          // The working right arm finishes vertical as the torso bends underneath the locked-out bell.
          r: {
            target: (J: FrontJoints) => add3(J.shoulder_r, lerp3([-52, 18, 68], [0, 125.5, 0], p)),
            pole: [-0.45, -0.35, -0.75], dir: [0, 1, 0],
          },
          l: {
            target: (J: FrontJoints) => add3(J.shoulder_l, lerp3([18, -112, 4], [45, -116, 0], p)),
            pole: [0.5, -0.3, -0.8], dir: [0, -1, 0],
          },
        },
      };
    },
  };
}
