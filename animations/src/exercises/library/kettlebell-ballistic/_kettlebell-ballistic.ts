// Private builders for kettlebell-ballistic. The side poses keep the feet planted and use a hip hinge for the backswing.
// Clean, jerk and snatch variants attach each bell to the hand that controls it. Front poses reserve the overhead arm at lockout.
import type { FrontExercise, MuscleSpec, SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math/vec2.ts';
import { timeline, type Timeline } from '@/math/timeline.ts';
import { add3 } from '@/math/vec3.ts';
import { type FrontJoints } from '@/rig/front.ts';
import { type Joints, type LimbSpec, type Pose } from '@/rig/side.ts';
import { handOnHip, standLegs } from '@/exercises/common.ts';
import { frontGripAt, gripAt, kettlebell } from '@/exercises/equipment/index.ts';

export interface BallisticBase {
  id: string;
  name: string;
  en: string;
  sources: string[];
}

const ballisticTL = timeline([
  { d: 0.58, from: 0, to: 1, e: [0.45, 1] },
  { d: 0.18, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.02, from: 1, to: 0, e: [0.82, 0.4] },
  { d: 0.28, from: 0, to: 0, e: [0.35, 0.35] },
]);

const jerkTL = timeline([
  { d: 0.22, from: 0, to: 0.2, e: [0.4, 0.7] },
  { d: 0.42, from: 0.2, to: 1, e: [0.8, 1] },
  { d: 0.22, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.00, from: 1, to: 0, e: [0.85, 0.35] },
  { d: 0.30, from: 0, to: 0, e: [0.35, 0.35] },
]);

const cleanPressTL = timeline([
  { d: 0.45, from: 0, to: 0.42, e: [0.45, 0.85] },
  { d: 0.62, from: 0.42, to: 1, e: [0.85, 1] },
  { d: 0.22, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.20, from: 1, to: 0, e: [0.85, 0.35] },
  { d: 0.28, from: 0, to: 0, e: [0.35, 0.35] },
]);

function sideBody(p: number, dead = false): Omit<Pose, 'arms'> {
  // Hang starts use a soft-knee hinge, not a stiff-leg deadlift. Dead cleans stay lower so the bell can reset on the floor.
  const lowHip: Vec2 = dead ? [245, 315] : [252, 280];
  const hip: Vec2 = [lerp(lowHip[0], 260, p), lerp(lowHip[1], 255, p)];
  const spineAngle = lerp(-48, -90, p);
  return {
    hip,
    spine: { lumbar: spineAngle, thoracic: spineAngle - 2 },
    neck: spineAngle + 4,
    head: spineAngle + 4,
    farHip: 0,
    legs: standLegs(260, 0),
  };
}

const hangArm = (): LimbSpec => ({ a1: 86, a2: 88, hand: 90 });
const swingArm = (): LimbSpec => ({ a1: 1, a2: 1, hand: 1 });

function shoulder(J: Joints, side: 'near' | 'far'): Vec2 {
  return side === 'near' ? J.S : J.Sf;
}

function cleanArm(p: number, side: 'near' | 'far'): LimbSpec {
  return {
    target: (J) => add(shoulder(J, side), [lerp(0, 34, p), lerp(124, 52, p)]),
    side: [1, 0],
    hand: lerp(90, -90, p),
  };
}

function snatchArm(p: number, side: 'near' | 'far'): LimbSpec {
  return {
    // The bell follows a forward pull arc before the hand punches overhead; a straight interpolation crosses the shoulder.
    target: (J) => add(shoulder(J, side), [60 * Math.sin(Math.PI * p) + 3 * p, lerp(124, -124, p)]),
    side: [1, 0],
    hand: lerp(90, -90, p),
  };
}

function overheadArm(side: 'near' | 'far'): LimbSpec {
  return { target: (J) => add(shoulder(J, side), [3, -124]), side: [1, 0], hand: -90 };
}

function pairedCleanArms(p: number, oneBell: boolean): Pose['arms'] {
  if (!oneBell) return { near: cleanArm(p, 'near'), far: cleanArm(p, 'far') };
  return {
    near: cleanArm(p, 'near'),
    // The far hand shares the single handle; the shoulder offset keeps both elbows bending naturally.
    far: {
      target: (J) => add(add(J.S, [lerp(0, 34, p), lerp(118, 52, p)]), [J.Sf[0] - J.S[0], J.Sf[1] - J.S[1]]),
      side: [1, 0], hand: lerp(90, -90, p),
    },
  };
}

function bellAngle(p: number, bottomsUp = false): number {
  // At a bottoms-up rack the bell body is above the handle, rather than in front of the forearm.
  return bottomsUp ? lerp(0, 180, p) : lerp(0, -90, p);
}

export function swing(o: BallisticBase, oneArm: boolean): SideExercise {
  return {
    ...o,
    tl: ballisticTL,
    meta: { en: o.en, family: 'kettlebell-ballistic', equipment: ['kettlebell'], sources: o.sources },
    muscles: oneArm
      ? [{ m: 'glutes' }, { m: 'hamstrings', side: 'near', scale: 0.75 }, { m: 'lowerBack', scale: 0.45 }, { m: 'forearms', side: 'near', scale: 0.35 }]
      : [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.75 }, { m: 'lowerBack', scale: 0.45 }, { m: 'forearms', side: 'both', scale: 0.35 }],
    dynamic: [kettlebell<Joints>((J, t) => ({ p: gripAt(J, 'n'), a: 0 }), 'edge')],
    poster: (0.58 + 0.09) / ballisticTL.total,
    pose(t) {
      const p = ballisticTL.at(t).p;
      return {
        ...sideBody(p),
        arms: oneArm
          ? { near: p < 0.5 ? hangArm() : swingArm(), far: handOnHip(-4) }
          : { near: p < 0.5 ? hangArm() : swingArm(), far: p < 0.5 ? hangArm() : swingArm() },
      };
    },
  };
}

export function clean(o: BallisticBase, kind: 'single' | 'dead' | 'double' | 'two-hands' | 'bottoms-up'): SideExercise {
  const double = kind === 'double';
  const oneBell = kind === 'two-hands';
  const single = !double && !oneBell;
  const dead = kind === 'dead';
  const bottomsUp = kind === 'bottoms-up';
  const muscles: MuscleSpec[] = bottomsUp
    ? [{ m: 'forearms', side: 'near' }, { m: 'biceps', side: 'near', scale: 0.55 }, { m: 'delts', side: 'near', scale: 0.4 }]
    : [{ m: 'hamstrings', side: double ? 'both' : 'near' }, { m: 'glutes', scale: 0.7 }, { m: 'traps', scale: 0.45 }, { m: 'forearms', side: double ? 'both' : 'near', scale: 0.4 }];
  return {
    ...o,
    tl: ballisticTL,
    meta: { en: o.en, family: 'kettlebell-ballistic', equipment: ['kettlebell'], sources: o.sources },
    muscles,
    dynamic: [
      kettlebell<Joints>((J, t) => ({ p: gripAt(J, 'n'), a: bellAngle(ballisticTL.at(t).p, bottomsUp) }), 'edge'),
      ...(double ? [kettlebell<Joints>((J, t) => ({ p: gripAt(J, 'f'), a: bellAngle(ballisticTL.at(t).p) }), 'edge', 'overFarArm', 'Far Kettlebell')] : []),
    ],
    poster: (0.58 + 0.09) / ballisticTL.total,
    pose(t) {
      const p = ballisticTL.at(t).p;
      return {
        ...sideBody(p, dead),
        // Side view needs a small depth offset so the two separately held bells do not collapse into one silhouette.
        farShoulder: double ? 18 : 4,
        arms: double ? pairedCleanArms(p, false) : oneBell ? pairedCleanArms(p, true) : { near: cleanArm(p, 'near'), far: handOnHip(-4) },
      };
    },
  };
}

export function alternatingClean(o: BallisticBase): SideExercise {
  return {
    ...o,
    tl: { total: 3.0 },
    meta: { en: o.en, family: 'kettlebell-ballistic', equipment: ['kettlebell'], sources: o.sources },
    muscles: [
      { m: 'hamstrings', side: 'both', e: () => 0.78 }, { m: 'glutes', scale: 0.65, e: () => 0.66 },
      { m: 'traps', scale: 0.45, e: () => 0.5 }, { m: 'forearms', side: 'both', scale: 0.4, e: () => 0.52 },
    ],
    dynamic: [
      kettlebell<Joints>((J, t) => ({ p: gripAt(J, 'n'), a: bellAngle((1 + Math.cos(Math.PI * 2 * t)) / 2) }), 'edge'),
      kettlebell<Joints>((J, t) => ({ p: gripAt(J, 'f'), a: bellAngle((1 - Math.cos(Math.PI * 2 * t)) / 2) }), 'edge', 'overFarArm', 'Far Kettlebell'),
    ],
    poster: 0,
    pose(t) {
      const near = (1 + Math.cos(Math.PI * 2 * t)) / 2;
      const far = 1 - near;
      return { ...sideBody(Math.max(near, far) * 0.7), arms: { near: cleanArm(near, 'near'), far: cleanArm(far, 'far') } };
    },
  };
}

/** A controlled toss clean: the bell turns over before its body lands on the open palm. */
export function openPalmClean(o: BallisticBase, oneArm: boolean): SideExercise {
  return {
    ...o,
    tl: ballisticTL,
    meta: { en: o.en, family: 'kettlebell-ballistic', equipment: ['kettlebell'], sources: o.sources },
    muscles: [{ m: 'forearms', side: oneArm ? 'near' : 'both' }, { m: 'biceps', side: oneArm ? 'near' : 'both', scale: 0.45 }, { m: 'glutes', scale: 0.55 }, { m: 'hamstrings', side: 'both', scale: 0.5 }],
    dynamic: [kettlebell<Joints>((J, t) => ({ p: gripAt(J, 'n'), a: 180 * ballisticTL.at(t).p }), 'edge')],
    poster: (0.58 + 0.09) / ballisticTL.total,
    pose(t) {
      const p = ballisticTL.at(t).p;
      const nearPalm = (J: Joints): Vec2 => add(J.S, [lerp(0, 28, p), lerp(124, 42, p)]);
      const palm = (side: 'near' | 'far'): LimbSpec => ({ target: side === 'near' ? nearPalm : (J) => add(J.Sf, [lerp(0, 28, p), lerp(124, 42, p)]), side: [1, 0], hand: lerp(90, -90, p) });
      return {
        ...sideBody(p, true),
        arms: oneArm
          ? { near: palm('near'), far: handOnHip(-4) }
          : { near: palm('near'), far: { target: (J) => add(nearPalm(J), [J.Sf[0] - J.S[0], J.Sf[1] - J.S[1]]), side: [1, 0], hand: lerp(90, -90, p) } },
      };
    },
  };
}

function jerkArms(p: number, both: boolean): Pose['arms'] {
  const press = Math.max(0, (p - 0.2) / 0.8);
  const arm = (side: 'near' | 'far'): LimbSpec => press < 0.01
    ? cleanArm(1, side)
    : { target: (J) => add(shoulder(J, side), [lerp(34, 3, press), lerp(52, -124, press)]), side: [1, 0], hand: lerp(-90, -90, press) };
  return both ? { near: arm('near'), far: arm('far') } : { near: arm('near'), far: handOnHip(-4) };
}

export function jerk(o: BallisticBase, both: boolean): SideExercise {
  return {
    ...o,
    tl: jerkTL,
    meta: { en: o.en, family: 'kettlebell-ballistic', equipment: ['kettlebell'], sources: o.sources },
    muscles: [{ m: 'delts', side: both ? 'both' : 'near' }, { m: 'triceps', side: both ? 'both' : 'near', scale: 0.6 }, { m: 'quads', side: 'both', scale: 0.45 }, { m: 'calves', side: 'both', scale: 0.3 }],
    dynamic: [
      kettlebell<Joints>((J, t) => ({ p: gripAt(J, 'n'), a: -90 }), 'edge'),
      ...(both ? [kettlebell<Joints>((J, t) => ({ p: gripAt(J, 'f'), a: -90 }), 'edge', 'overFarArm', 'Far Kettlebell')] : []),
    ],
    poster: (0.22 + 0.42 + 0.11) / jerkTL.total,
    pose(t) {
      const q = jerkTL.at(t).p;
      const dip = q < 0.2 ? q / 0.2 : 0;
      const body = sideBody(1);
      return {
        ...body,
        hip: [260, 255 + 13 * dip],
        farShoulder: both ? 18 : 4,
        arms: jerkArms(q, both),
      };
    },
  };
}

export function snatch(o: BallisticBase, both: boolean, split = false): SideExercise {
  return {
    ...o,
    tl: ballisticTL,
    meta: { en: o.en, family: 'kettlebell-ballistic', equipment: ['kettlebell'], sources: o.sources },
    muscles: [{ m: 'delts', side: both ? 'both' : 'near' }, { m: 'glutes', scale: 0.65 }, { m: 'hamstrings', side: 'both', scale: 0.65 }, { m: 'triceps', side: both ? 'both' : 'near', scale: 0.5 }],
    dynamic: [
      kettlebell<Joints>((J, t) => ({ p: gripAt(J, 'n'), a: bellAngle(ballisticTL.at(t).p) }), 'edge'),
      ...(both ? [kettlebell<Joints>((J, t) => ({ p: gripAt(J, 'f'), a: bellAngle(ballisticTL.at(t).p) }), 'edge', 'overFarArm', 'Far Kettlebell')] : []),
    ],
    poster: (0.58 + 0.09) / ballisticTL.total,
    pose(t) {
      const p = ballisticTL.at(t).p;
      const base = sideBody(p);
      if (!split) return {
        ...base,
        farShoulder: both ? 18 : 4,
        arms: both ? { near: snatchArm(p, 'near'), far: snatchArm(p, 'far') } : { near: snatchArm(p, 'near'), far: handOnHip(-4) },
      };
      const lunge = p;
      return {
        ...base,
        hip: [lerp(base.hip[0], 260, lunge), lerp(base.hip[1], 290, lunge)],
        legs: {
          near: { target: [lerp(260, 288, lunge), 439], foot: 0, side: [1, 0] },
          far: { target: [lerp(260, 222, lunge), 439], foot: 0, side: [1, 0] },
        },
        arms: { near: snatchArm(p, 'near'), far: handOnHip(-4) },
      };
    },
  };
}

export function cleanPress(o: BallisticBase): SideExercise {
  return {
    ...o,
    tl: cleanPressTL,
    meta: { en: o.en, family: 'kettlebell-ballistic', equipment: ['kettlebell'], sources: o.sources },
    muscles: [{ m: 'delts', side: 'near' }, { m: 'triceps', side: 'near', scale: 0.6 }, { m: 'glutes', scale: 0.45 }, { m: 'forearms', side: 'near', scale: 0.35 }],
    dynamic: [kettlebell<Joints>((J, t) => ({ p: gripAt(J, 'n'), a: bellAngle(Math.min(1, cleanPressTL.at(t).p / 0.42)) }), 'edge')],
    poster: (0.45 + 0.62 + 0.11) / cleanPressTL.total,
    pose(t) {
      const q = cleanPressTL.at(t).p;
      const cleanP = Math.min(1, q / 0.42);
      const pressP = Math.max(0, (q - 0.42) / 0.58);
      const base = sideBody(Math.min(1, q / 0.42));
      const arm: LimbSpec = pressP === 0 ? cleanArm(cleanP, 'near') : {
        target: (J) => add(J.S, [lerp(34, 3, pressP), lerp(52, -124, pressP)]), side: [1, 0], hand: -90,
      };
      return { ...base, arms: { near: arm, far: handOnHip(-4) } };
    },
  };
}

export function sumoHighPull(o: BallisticBase): FrontExercise {
  return {
    ...o,
    view: 'front',
    tl: ballisticTL,
    meta: { en: o.en, family: 'kettlebell-ballistic', equipment: ['kettlebell'], sources: o.sources },
    muscles: [{ m: 'traps' }, { m: 'adductors', scale: 0.55 }, { m: 'glutes', scale: 0.65, region: { view: 'front', part: 'pelvis', c: [0, 7], s: [36, 25] } }, { m: 'delts', scale: 0.4 }],
    dynamic: [kettlebell<FrontJoints>((J) => ({ p: [(frontGripAt(J, 'l')[0] + frontGripAt(J, 'r')[0]) / 2, (frontGripAt(J, 'l')[1] + frontGripAt(J, 'r')[1]) / 2], a: 0 }), 'face')],
    poster: (0.58 + 0.09) / ballisticTL.total,
    pose(t) {
      const p = ballisticTL.at(t).p;
      const legX = 70;
      return {
        // A 140 px stance needs a lower tall pelvis than parallel feet. This keeps each leg inside its 184 px reach.
        pelvis: [0, lerp(156, 180, p), 0],
        hips: { pitch: lerp(16, 0, p) },
        spine: { pitch: lerp(-8, 0, p) },
        legs: {
          l: { target: [legX, 13, 3] },
          r: { target: [-legX, 13, 3] },
        },
        arms: {
          l: { target: (J) => add3(J.shoulder_l, [lerp(-18, -22, p), lerp(-118, -62, p), 28]), pole: [70, 270, 40] },
          r: { target: (J) => add3(J.shoulder_r, [lerp(18, 22, p), lerp(-118, -62, p), 28]), pole: [-70, 270, 40] },
        },
      };
    },
  };
}

const behindOrder: FrontExercise['order'] = [
  'thigh_r', 'shin_r', 'foot_r', 'thigh_l', 'shin_l', 'foot_l', 'pelvis',
  'upper_l', 'fore_l', 'hand_l',
  'torso', 'abs', 'lats', 'chest', 'traps', 'neck', 'collar', 'head',
  'upper_r', 'fore_r', 'hand_r',
];

export function windmill(o: BallisticBase, opts: { double?: boolean; behind?: boolean } = {}): FrontExercise {
  const double = opts.double ?? false;
  const behind = opts.behind ?? false;
  return {
    ...o,
    view: 'front',
    tl: timeline([
      { d: 1.4, from: 0, to: 1, e: [0.4, 0.9] },
      { d: 0.7, from: 1, to: 1, e: [0.9, 0.85] },
      { d: 1.5, from: 1, to: 0, e: [0.8, 0.35] },
      { d: 0.4, from: 0, to: 0, e: [0.35, 0.3] },
    ]),
    meta: { en: o.en, family: 'kettlebell-ballistic', equipment: ['kettlebell'], sources: o.sources },
    muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.7 }, { m: 'delts', side: 'r', scale: 0.55 }, { m: 'triceps', side: 'r', scale: 0.35, region: { view: 'front', part: 'upper', c: [0, 35], s: [11, 29] } }],
    dynamic: [
      kettlebell<FrontJoints>((J) => ({ p: frontGripAt(J, 'r'), a: 180 }), 'face'),
      ...(double ? [kettlebell<FrontJoints>((J) => ({ p: frontGripAt(J, 'l'), a: 0 }), 'face', 'front', 'Low Kettlebell')] : []),
    ],
    ...(behind ? { order: behindOrder } : {}),
    poster: (1.4 + 0.35) / 4.0,
    pose(t) {
      const p = (this.tl as Timeline).at(t).p;
      return {
        // Shift the hips under the locked bell, then side-hinge deeply enough for the free hand to reach below the knee.
        pelvis: [lerp(0, 32, p), lerp(195, 145, p), 0],
        hips: { roll: lerp(0, 10, p) },
        spine: { roll: lerp(0, 58, p), pitch: lerp(0, 8, p) },
        neck: { roll: lerp(0, -14, p) },
        head: { roll: lerp(0, -12, p), yaw: lerp(0, -20, p) },
        legs: { l: { target: [32, 13, 2] }, r: { target: [-32, 13, 2] } },
        arms: {
          r: { target: (J) => add3(J.shoulder_r, [0, 124, 12]), pole: [-38, 360, -5] },
          l: behind
            ? { target: (J) => add3(J.pelvis, [8, 14, -35]), pole: [35, 215, -55] }
            // Keep the reaching arm inside the 126 px anatomical reach of the front rig.
            : { target: (J) => add3(J.shoulder_l, [lerp(0, 44, p), lerp(-110, -112, p), 8]), pole: [85, 210, 25] },
        },
      };
    },
  };
}
