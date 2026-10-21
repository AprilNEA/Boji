// Private builders for push-up-2. Each builder keeps the planted wrists, toes, or support surface fixed.
// The side rig faces right, so feet are left of the hands in every prone pose.
import type { LibraryMeta, MovingPart, MuscleSpec, Props, SideExercise } from '@/exercise.ts';
import type { Palette } from '@/draw/palettes.ts';
import { add, dir, len, lerp, mul, sub, type Vec2 } from '@/math/vec2.ts';
import { bump, easeSinOut, timeline, type Timeline } from '@/math/timeline.ts';
import { BODY, solve, type Joints, type LimbSpec, type Pose } from '@/rig/side.ts';
import { ARM_STRAIGHT, FLOOR, hipForShoulder, plantedArm, HIGH_PLANK } from '@/exercises/common.ts';
import { dumbbell, kettlebell, medicineBall, stabilityBall } from '@/exercises/equipment/index.ts';

export const PUSH_TL = timeline([
  { d: 1.25, from: 0, to: 1, e: [0.35, 0.7] },
  { d: 0.2, from: 1, to: 1, e: [0.7, 0.9] },
  { d: 1.05, from: 1, to: 0, e: [1, 0.75] },
  { d: 0.45, from: 0, to: 0, e: [0.55, 0.3] },
]);

export const PLYO_TL = timeline([
  { d: 0.7, from: 0, to: 1, e: [0.35, 0.8] },
  { d: 0.1, from: 1, to: 1, e: [0.8, 1] },
  { d: 0.28, from: 1, to: 0, e: [1, 0.85] },
  { d: 0.32, from: 0, to: 0, e: [0.8, 0.35] },
]);

export const pushMuscles = (): MuscleSpec[] => [
  { m: 'pecs' }, { m: 'triceps', side: 'both' }, { m: 'delts', side: 'near', scale: 0.5 }, { m: 'abs', scale: 0.4 },
];
export const tricepsMuscles = (): MuscleSpec[] => [
  { m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.6 }, { m: 'delts', side: 'near', scale: 0.4 }, { m: 'abs', scale: 0.35 },
];

export interface PushInfo {
  id: string;
  name: string;
  en: string;
  sources: string[];
  equipment: LibraryMeta['equipment'];
  muscles?: MuscleSpec[];
  tl?: Timeline;
  mat?: boolean;
  props?: (pal: Palette) => Props;
  propsBox?: [number, number];
  dynamic?: MovingPart[];
  poster?: number;
}

/** High-plank push-up at the supplied descent fraction. p=0 has straight arms; p=1 has an 80° elbow. */
export function floorPose(p: number, opts: { wrist?: Vec2; farWrist?: Vec2; shoulderShift?: number; farAnkleDx?: number } = {}): Pose {
  const wrist = opts.wrist ?? HIGH_PLANK.wrist;
  const farWrist = opts.farWrist ?? add(wrist, [-3, 0]);
  const support = opts.wrist === undefined && opts.farWrist === undefined && opts.farAnkleDx === undefined
    ? FLOOR_SUPPORT
    : floorSupport(wrist, farWrist, opts.farAnkleDx);
  return {
    ...support.body(lerp(support.top, support.bottom, p)),
    shoulderShift: opts.shoulderShift,
    legs: support.body(support.top).legs,
    arms: { near: plantedArm(wrist), far: plantedArm(farWrist) },
  };
}

export function floorPush(info: PushInfo): SideExercise {
  const tl = info.tl ?? PUSH_TL;
  return {
    id: info.id, name: info.name, tl, mat: info.mat ?? true,
    meta: { en: info.en, family: 'push-up', equipment: info.equipment, sources: info.sources },
    muscles: info.muscles ?? pushMuscles(), props: info.props, propsBox: info.propsBox, dynamic: info.dynamic, poster: info.poster,
    pose: (t) => floorPose(tl.at(t).p),
  };
}

/** A brief take-off follows elbow extension. The hands and upper body leave the mat while the toes stay planted. */
export function plyoPush(info: PushInfo): SideExercise {
  return {
    id: info.id, name: info.name, tl: PLYO_TL, mat: true,
    meta: { en: info.en, family: 'push-up', equipment: info.equipment, sources: info.sources },
    muscles: info.muscles ?? pushMuscles(), props: info.props, propsBox: info.propsBox, dynamic: info.dynamic,
    pose: (t) => {
      const p = PLYO_TL.at(t).p;
      // The short flight follows the press. It reaches 14 px of clearance before the hands land softly.
      const air = t > 0.52 && t < 0.76 ? Math.sin(Math.PI * (t - 0.52) / 0.24) : 0;
      const wrist = add(HIGH_PLANK.wrist, [0, -14 * air]);
      return {
        ...floorPose(p),
        arms: { near: plantedArm(wrist), far: plantedArm(add(wrist, [-3, 0])) },
      };
    },
  };
}

export interface SupportGeometry {
  ankle: Vec2;
  wrist: Vec2;
  wristFar: Vec2;
  body: (angle: number) => Omit<Pose, 'arms'>;
  top: number;
  bottom: number;
}

/**
 * Solve a rigid plank between toe contact and a raised hand support. The search chooses an upright enough body angle
 * with straight arms at the top and approximately 85° elbows at the bottom.
 */
export function raisedSupport(wrist: Vec2, ankle: Vec2 = [92, FLOOR - 41]): SupportGeometry {
  const body = (angle: number): Omit<Pose, 'arms'> => ({
    hip: add(ankle, mul(dir(angle), BODY.thigh + BODY.shin - 3)),
    farHip: 0, farShoulder: 0,
    spine: { lumbar: angle, thoracic: angle - 1 }, neck: angle - 4, head: angle + 2,
    legs: {
      near: { target: ankle, side: [0, 1], foot: 85 },
      far: { target: add(ankle, [-2, 0]), side: [0, 1], foot: 85 },
    },
  });
  const shoulderAt = (angle: number): Vec2 => solve({ ...body(angle), arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } } }).S;
  const closest = (from: number, to: number, aim: number): number => {
    let out = from, err = Infinity;
    for (let a = from; a <= to; a += 0.2) {
      const d = Math.abs(len(sub(shoulderAt(a), wrist)) - aim);
      if (d < err) { out = a; err = d; }
    }
    return out;
  };
  const top = closest(-58, 8, ARM_STRAIGHT);
  const elbow = (angle: number): number => {
    const J = solve({
      ...body(angle),
      arms: {
        near: { target: wrist, side: [-1, 0] },
        far: { target: add(wrist, [-3, 0]), side: [-1, 0] },
      },
    });
    const u = sub(J.S, J.elbow_n), v = sub(J.wrist_n, J.elbow_n);
    return Math.acos((u[0] * v[0] + u[1] * v[1]) / (len(u) * len(v))) * 180 / Math.PI;
  };
  // Stop at an 80° elbow. This avoids a folded-over IK solution and keeps the chest above its support.
  let bottom = top, best = Infinity;
  for (let a = top; a <= Math.min(42, top + 10); a += 0.2) {
    const err = Math.abs(elbow(a) - 80);
    if (err < best) { bottom = a; best = err; }
  }
  return { ankle, wrist, wristFar: add(wrist, [-3, 0]), body, top, bottom };
}

/** Floor supports use fixed toes, straight arms at the top, and an 80° elbow at the bottom. */
function floorSupport(wrist: Vec2, wristFar: Vec2, farAnkleDx?: number): SupportGeometry {
  const base = raisedSupport(wrist, [92, FLOOR - 41]);
  const body = (angle: number): Omit<Pose, 'arms'> => {
    const pose = base.body(angle);
    return {
      ...pose,
      legs: {
        near: pose.legs.near,
        far: farAnkleDx === undefined
          ? pose.legs.far
          : { target: add(base.ankle, [farAnkleDx, 0]), side: [0, 1], foot: 85 },
      },
    };
  };
  return { ...base, wrist, wristFar, body, bottom: base.top + 9 };
}

const FLOOR_SUPPORT = floorSupport(HIGH_PLANK.wrist, HIGH_PLANK.wristFar);

export function supportPose(s: SupportGeometry, p: number, hand = 0): Pose {
  return {
    ...s.body(lerp(s.top, s.bottom, p)),
    arms: {
      near: { target: s.wrist, side: [-1, 0], hand },
      far: { target: s.wristFar, side: [-1, 0], hand },
    },
  };
}

export function supportPush(info: PushInfo, support: SupportGeometry, hand = 0): SideExercise {
  const tl = info.tl ?? PUSH_TL;
  return {
    id: info.id, name: info.name, tl, mat: info.mat ?? true,
    meta: { en: info.en, family: 'push-up', equipment: info.equipment, sources: info.sources },
    muscles: info.muscles ?? pushMuscles(), props: info.props, propsBox: info.propsBox, dynamic: info.dynamic, poster: info.poster,
    pose: (t) => supportPose(support, tl.at(t).p, hand),
  };
}

/** Elevated-toe decline push-up. The ball or box top fixes the toe contact while the wrists remain planted. */
export function elevatedFeetPush(info: PushInfo, ankle: Vec2, wrist: Vec2 = HIGH_PLANK.wrist): SideExercise {
  const body = (angle: number): Omit<Pose, 'arms'> => ({
    hip: add(ankle, mul(dir(angle), BODY.thigh + BODY.shin - 3)), farHip: 0, farShoulder: 0,
    spine: { lumbar: angle, thoracic: angle - 1 }, neck: angle - 4, head: angle + 2,
    legs: {
      near: { target: ankle, side: [0, 1], foot: 85 },
      far: { target: add(ankle, [-2, 0]), side: [0, 1], foot: 85 },
    },
  });
  const wristFar = add(wrist, [-3, 0]);
  const arms = { near: plantedArm(wrist), far: plantedArm(wristFar) };
  let top = -45, err = Infinity;
  for (let a = -55; a <= 35; a += 0.2) {
    const J = solve({ ...body(a), arms });
    // The far shoulder sits behind the near one. Test both arms so neither reaches beyond its IK limit.
    const next = Math.max(
      Math.abs(len(sub(J.S, wrist)) - (ARM_STRAIGHT - 1.2)),
      Math.abs(len(sub(J.Sf, wristFar)) - (ARM_STRAIGHT - 1.2)),
    );
    if (next < err) { top = a; err = next; }
  }
  const elbow = (angle: number): number => {
    const J = solve({ ...body(angle), arms });
    const u = sub(J.S, J.elbow_n), v = sub(J.wrist_n, J.elbow_n);
    return Math.acos((u[0] * v[0] + u[1] * v[1]) / (len(u) * len(v))) * 180 / Math.PI;
  };
  let bottom = top, best = Infinity;
  for (let a = top; a <= Math.min(35, top + 10); a += 0.2) {
    const next = Math.abs(elbow(a) - 80);
    if (next < best) { bottom = a; best = next; }
  }
  const tl = info.tl ?? PUSH_TL;
  return {
    id: info.id, name: info.name, tl, mat: true,
    meta: { en: info.en, family: 'push-up', equipment: info.equipment, sources: info.sources },
    muscles: info.muscles ?? pushMuscles(), props: info.props, propsBox: info.propsBox, dynamic: info.dynamic, poster: info.poster,
    pose: (t) => ({ ...body(lerp(top, bottom, tl.at(t).p)), arms }),
  };
}

/** A one-arm push-up keeps the working wrist planted and folds the free far arm behind the torso. */
export function singleArmPush(info: PushInfo, lateral = false): SideExercise {
  return {
    id: info.id, name: info.name, tl: PUSH_TL, mat: true,
    meta: { en: info.en, family: 'push-up', equipment: info.equipment, sources: info.sources },
    muscles: [{ m: 'pecs', scale: 0.9 }, { m: 'triceps', side: 'near' }, { m: 'delts', side: 'near', scale: 0.65 }, { m: 'abs', scale: 0.45 }],
    pose: (t) => {
      const p = PUSH_TL.at(t).p;
      const base = FLOOR_SUPPORT.body(lerp(FLOOR_SUPPORT.top, FLOOR_SUPPORT.bottom, p));
      const free: LimbSpec = lateral
        // Side view cannot show the transverse direction. The extended arm projects forward at shoulder height.
        ? { a1: 0, a2: 0, hand: 0 }
        // The hand rests on the lower back, not below the torso or the mat.
        : { target: (J) => add(J.Hf, [-14, -5]), side: [1, 0], hand: 180 };
      return {
        ...base,
        // The side-view rig cannot project a wide stance without changing leg length. Both toes therefore retain
        // their reachable plank contacts while the free arm identifies the unilateral variation.
        legs: base.legs,
        arms: { near: plantedArm(HIGH_PLANK.wrist), far: free },
      };
    },
  };
}

const PLANK_REST = (() => {
  const body = FLOOR_SUPPORT.body(FLOOR_SUPPORT.top);
  const J = solve({ ...body, arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) } });
  return {
    near: { a1: J.thigh_n.a, a2: J.shin_n.a, foot: J.foot_n.a },
    far: { a1: J.thigh_f.a, a2: J.shin_f.a, foot: J.foot_f.a },
    armNear: { a1: J.upper_n.a, a2: J.fore_n.a, hand: J.hand_n.a },
    armFar: { a1: J.upper_f.a, a2: J.fore_f.a, hand: J.hand_f.a },
  };
})();
const DRIVE = (p: number, side: 'near' | 'far', spider = false): LimbSpec => {
  const rest = PLANK_REST[side];
  const da = side === 'far' ? 2 : 0;
  const a1 = 40 + da;
  // In the spider variation the knee tracks down and forward while the shin folds upward below the abdomen.
  // Keep 230° on the same angle branch as the resting shin, so interpolation does not swing through the mat.
  const a2 = spider ? 230 + da : 186 + da;
  const foot = spider ? -85 + da : 48 + da;
  // Start the spider knee drive ahead of the chest descent, so the lifted knee clears the mat throughout the motion.
  const progress = spider ? easeSinOut(easeSinOut(p)) : p;
  return { a1: lerp(rest.a1, a1, progress), a2: lerp(rest.a2, a2, progress), foot: lerp(rest.foot, foot, progress) };
};

/** Alternate a full push-up with two high-plank knee drives. */
export function pushToClimber(info: PushInfo): SideExercise {
  const tl = timeline([{ d: 4.2, from: 0, to: 1, e: [0.35, 0.85] }]);
  return {
    id: info.id, name: info.name, tl, mat: true,
    meta: { en: info.en, family: 'push-up', equipment: info.equipment, sources: info.sources },
    muscles: [{ m: 'pecs', e: (t) => t < 0.45 ? 1 : 0.25 }, { m: 'hipFlexor', side: 'both', e: (t) => t < 0.45 ? 0.2 : 0.9 }, { m: 'abs', scale: 0.65 }, { m: 'delts', side: 'near', scale: 0.5 }],
    pose: (t) => {
      const phase = t * 4.2;
      if (phase < 1.9) {
        const p = phase < 0.95 ? phase / 0.95 : (1.9 - phase) / 0.95;
        return floorPose(p);
      }
      const u = (phase - 1.9) / 2.3;
      const rep = u < 0.5 ? 0 : 1;
      const q = Math.sin(Math.PI * ((u % 0.5) * 2));
      const base = FLOOR_SUPPORT.body(FLOOR_SUPPORT.top);
      return {
        ...base,
        legs: rep === 0 ? { near: DRIVE(q, 'near'), far: PLANK_REST.far } : { near: PLANK_REST.near, far: DRIVE(q, 'far') },
        arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) },
      };
    },
  };
}

/** Spider push-up: one knee travels toward the same-side elbow as the chest reaches its low position. */
export function spidermanPush(info: PushInfo): SideExercise {
  const tl = timeline([{ d: 3.5, from: 0, to: 1, e: [0.4, 0.9] }]);
  return {
    id: info.id, name: info.name, tl, mat: true,
    meta: { en: info.en, family: 'push-up', equipment: info.equipment, sources: info.sources },
    muscles: [{ m: 'pecs' }, { m: 'abs', scale: 0.65 }, { m: 'hipFlexor', side: 'both', scale: 0.75 }, { m: 'delts', side: 'near', scale: 0.45 }],
    // The peak knee drive identifies this variation more clearly than the default resting plank poster.
    poster: 0.25,
    pose: (t) => {
      const half = t < 0.5 ? 0 : 1;
      const u = (t % 0.5) * 2;
      const p = bump(u);
      const base = FLOOR_SUPPORT.body(lerp(FLOOR_SUPPORT.top, FLOOR_SUPPORT.bottom, p));
      const near = DRIVE(p, 'near', true);
      const far = DRIVE(p, 'far', true);
      return {
        ...base,
        legs: half === 0 ? { near, far: PLANK_REST.far } : { near: PLANK_REST.near, far },
        arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) },
      };
    },
  };
}

/** Opposite arm and leg lift during the low phase, alternating sides on consecutive repetitions. */
export function supermanPush(info: PushInfo): SideExercise {
  const tl = timeline([{ d: 3.6, from: 0, to: 1, e: [0.4, 0.9] }]);
  return {
    id: info.id, name: info.name, tl, mat: true,
    meta: { en: info.en, family: 'push-up', equipment: info.equipment, sources: info.sources },
    muscles: [{ m: 'pecs' }, { m: 'abs', scale: 0.65 }, { m: 'glutes', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.55 }],
    pose: (t) => {
      const rep = t < 0.5 ? 0 : 1;
      const u = (t % 0.5) * 2;
      const p = Math.sin(Math.PI * u);
      const base = FLOOR_SUPPORT.body(lerp(FLOOR_SUPPORT.top, FLOOR_SUPPORT.bottom, p));
      const liftArm = (side: 'near' | 'far'): LimbSpec => {
        const rest = side === 'near' ? PLANK_REST.armNear : PLANK_REST.armFar;
        return { a1: lerp(rest.a1, 0, p), a2: lerp(rest.a2, 0, p), hand: lerp(rest.hand, 0, p) };
      };
      const liftLeg = (side: 'near' | 'far'): LimbSpec => {
        const rest = PLANK_REST[side];
        return { a1: lerp(rest.a1, 180, p), a2: lerp(rest.a2, 180, p), foot: lerp(rest.foot, 180, p) };
      };
      return {
        ...base,
        legs: rep === 0 ? { near: liftLeg('near'), far: PLANK_REST.far } : { near: PLANK_REST.near, far: liftLeg('far') },
        arms: rep === 0 ? { near: plantedArm(HIGH_PLANK.wrist), far: liftArm('far') } : { near: liftArm('near'), far: plantedArm(HIGH_PLANK.wristFar) },
      };
    },
  };
}

/** An upside-down wall handstand. The wrists stay on the floor; the shoulder moves down only while the elbows flex. */
export function wallHandstand(info: PushInfo): SideExercise {
  const tl = PUSH_TL;
  const wrist: Vec2 = [292, FLOOR - 7];
  return {
    id: info.id, name: info.name, tl, mat: true,
    meta: { en: info.en, family: 'push-up', equipment: info.equipment, sources: info.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.8 }, { m: 'abs', scale: 0.45 }],
    props: (pal) => ({ back: [
      { kind: 'box', nm: 'wall', color: pal.prop, c: [235, 235], s: [42, 420], r: 5 },
      { kind: 'box', nm: 'baseboard', color: pal.propDark, c: [235, FLOOR - 3], s: [42, 12], r: 2 },
    ] }),
    propsBox: [214, 313],
    pose: (t) => {
      const p = tl.at(t).p;
      const shoulder: Vec2 = [292, lerp(313, 346, p)];
      const spine = { lumbar: 90, thoracic: 90 };
      const hip = hipForShoulder(shoulder, spine);
      return {
        hip, spine, neck: 90, head: 90, farHip: 0, farShoulder: 0,
        legs: { near: { a1: -90, a2: -90, foot: 180 }, far: { a1: -90, a2: -90, foot: 180 } },
        arms: {
          near: { target: wrist, side: [1, 0], hand: 90 },
          far: { target: add(wrist, [-3, 0]), side: [1, 0], hand: 90 },
        },
      };
    },
  };
}

/** A pike with fixed hands and shins on the ball. The hip stays high while the shoulders descend between the hands. */
export function ballPike(info: PushInfo): SideExercise {
  const tl = PUSH_TL;
  const wrist: Vec2 = [355, FLOOR - 7];
  // This hip height keeps the shoulders within a straight-arm reach of the planted wrists.
  const hip: Vec2 = [240, 258];
  return {
    id: info.id, name: info.name, tl, mat: true,
    meta: { en: info.en, family: 'push-up', equipment: info.equipment, sources: info.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.75 }, { m: 'abs', scale: 0.7 }, { m: 'pecs', scale: 0.55 }],
    dynamic: [stabilityBall(() => ({ p: [142, FLOOR - 68] }), 'back')],
    propsBox: [74, 423],
    pose: (t) => {
      const p = tl.at(t).p;
      const spineAngle = lerp(45, 61, p);
      return {
        hip, spine: { lumbar: spineAngle, thoracic: spineAngle - 1 }, neck: spineAngle - 4, head: spineAngle + 2,
        farHip: 0, farShoulder: 0,
        // The long shins cross the top of the ball. The knee stays almost straight.
        legs: { near: { a1: 150, a2: 150, foot: 170 }, far: { a1: 151, a2: 151, foot: 171 } },
        arms: {
          near: { target: wrist, side: [-1, 0], hand: 0 },
          far: { target: add(wrist, [-3, 0]), side: [-1, 0], hand: 0 },
        },
      };
    },
  };
}

// Equipment placements used by short item scripts. They follow the planted hands when the support is floor-level.
export const floorDumbbells = (): MovingPart[] => [dumbbell('f', 'profile'), dumbbell('n', 'profile')];
export const floorKettlebells = (s: SupportGeometry): MovingPart[] => [
  kettlebell(() => ({ p: s.wristFar }), 'edge', 'overFarArm', 'Far Kettlebell'),
  kettlebell(() => ({ p: s.wrist }), 'edge', 'front', 'Near Kettlebell'),
];
export const medicineBallSupport = (center: Vec2): MovingPart[] => [medicineBall(() => ({ p: center }), 'front')];
export const stabilityBallSupport = (center: Vec2): MovingPart[] => [stabilityBall(() => ({ p: center }), 'back')];

/** A rigid weighted vest follows the torso so the loaded-drop variation remains readable in every frame. */
export const weightedVest: MovingPart[] = [{
  nm: 'Weighted Vest', kind: 'rigid', z: 'front',
  shapes: (pal) => [
    { kind: 'box', nm: 'vest', color: pal.pad, c: [0, 0], s: [35, 70], r: 7 },
    { kind: 'box', nm: 'vest-stripe', color: pal.accent, c: [0, 0], s: [6, 64], r: 2 },
    { kind: 'box', nm: 'vest-weight-a', color: pal.metalDark, c: [-8, -15], s: [12, 14], r: 2 },
    { kind: 'box', nm: 'vest-weight-b', color: pal.metalDark, c: [8, 15], s: [12, 14], r: 2 },
  ],
  at: (J: Joints) => ({ p: J.B(0.55), a: J.tAbs.a }),
}];
