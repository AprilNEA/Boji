// Private builders for the push-up-1 work list.
// Every floor contact is an IK target; plank variants keep a long trunk rather than moving the hips independently.
// The front builder looks down the length of a prone body so that side-to-side hand and arm changes stay visible.
import type { FrontExercise, SideExercise } from '@/exercise.ts';
import { add, ang, dir, lerp, mul, smooth, sub, timeline, type Vec2 } from '@/math.ts';
import { BODY, solve, type Joints, type LimbSpec, type Pose } from '@/rig.ts';
import { toeDir, type FrontJoints } from '@/front-rig.ts';
import { FLOOR, G, hipForShoulder, plantedArm } from '@/exercises/common.ts';
import { aerobicStep, bandCurve, kettlebell, KETTLEBELL, plyoBox, sagPoints, workTL } from '@/exercises/equipment/index.ts';
import { HIGH_PLANK } from '@/exercises/push-up.ts';

export type PushMeta = { id: string; name: string; en: string; sources: string[] };
const tl = workTL(0.28);
const WRIST_Y = FLOOR - 7;

function basePlank(p: number, near: LimbSpec = plantedArm(HIGH_PLANK.wrist), far: LimbSpec = plantedArm(HIGH_PLANK.wristFar)): Pose {
  return {
    ...HIGH_PLANK.body(lerp(HIGH_PLANK.top, HIGH_PLANK.bottom, p)),
    arms: { near, far },
  };
}

/** A standard floor repetition with the elbow bend driven by the fixed palms and toes. */
export function floorPush(meta: PushMeta, opts: { close?: boolean; band?: boolean; wide?: boolean } = {}): SideExercise {
  const wrist = opts.close ? add(HIGH_PLANK.wrist, [-6, 0]) as Vec2 : HIGH_PLANK.wrist;
  const wristFar = opts.close ? add(HIGH_PLANK.wristFar, [-6, 0]) as Vec2 : HIGH_PLANK.wristFar;
  return {
    ...meta, tl, mat: true,
    meta: { en: meta.en, family: 'push-up', equipment: opts.band ? ['bodyweight', 'band'] : ['bodyweight'], sources: meta.sources },
    muscles: opts.close
      ? [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.62 }, { m: 'delts', side: 'both', scale: 0.38 }, { m: 'abs', scale: 0.35 }]
      : [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.7 }, { m: 'delts', side: 'both', scale: 0.48 }, { m: 'abs', scale: 0.38 }],
    dynamic: opts.band ? [bandCurve<Joints>((J) => {
      const a = add(J.elbow_f, [-6, -10]) as Vec2;
      const b = add(J.elbow_n, [7, -10]) as Vec2;
      return sagPoints(a, b, 5);
    }, 'underNearArm', 'Upper-arm resistance band')] : undefined,
    poster: 0,
    pose(t) {
      const p = tl.at(t).p;
      return {
        ...HIGH_PLANK.body(lerp(HIGH_PLANK.top, HIGH_PLANK.bottom, p)),
        arms: { near: plantedArm(wrist), far: plantedArm(wristFar) },
      };
    },
  } satisfies SideExercise;
}

/** Alternating shoulder or chest touch. The reaching hand returns to its original planted contact every half loop. */
export function alternatingTap(meta: PushMeta, kind: 'shoulder' | 'chest'): SideExercise {
  const tapTL = timeline([
    { d: 0.8, from: 0, to: 1, e: [0.35, 0.95] },
    { d: 0.25, from: 1, to: 1, e: [0.95, 0.75] },
    { d: 0.55, from: 1, to: 0, e: [0.75, 0.35] },
    { d: 0.8, from: 0, to: 1, e: [0.35, 0.95] },
    { d: 0.25, from: 1, to: 1, e: [0.95, 0.75] },
    { d: 0.55, from: 1, to: 0, e: [0.75, 0.35] },
  ]);
  const touch = (far: boolean, q: number): LimbSpec => ({
    target: (J) => {
      const target = kind === 'shoulder'
        ? add(far ? J.S : J.Sf, [8, 12]) as Vec2
        : add(J.B(0.72), [8, 10]) as Vec2;
      const palm = far ? HIGH_PLANK.wristFar : HIGH_PLANK.wrist;
      return [lerp(palm[0], target[0], q), lerp(palm[1], target[1], q)];
    },
    side: [-1, 0], hand: 20,
  });
  return {
    ...meta, tl: tapTL, mat: true, poster: 0.13,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.62 }, { m: 'abs', scale: 0.58 }, { m: 'delts', side: 'both', scale: 0.48 }],
    pose(t) {
      const phase = tapTL.at(t);
      const nearTurn = t < 0.5;
      // A normal press happens as the tapping arm leaves and returns, then the hand reaches at lockout.
      const press = phase.p < 0.72 ? phase.p / 0.72 : 0;
      const q = smooth(Math.max(0, (phase.p - 0.5) / 0.5));
      return basePlank(press,
        nearTurn ? touch(false, q) : plantedArm(HIGH_PLANK.wrist),
        nearTurn ? plantedArm(HIGH_PLANK.wristFar) : touch(true, q));
    },
  } satisfies SideExercise;
}

/** One planted arm presses while the other reaches sideways in the sagittal screen plane. */
export function singleArmPush(meta: PushMeta): SideExercise {
  const oneTL = timeline([
    { d: 1, from: 0, to: 1, e: [0.4, 1] }, { d: 0.25, from: 1, to: 1, e: [1, 0.9] },
    { d: 1.2, from: 1, to: 0, e: [0.9, 0.4] }, { d: 0.4, from: 0, to: 0, e: [0.4, 0.35] },
  ]);
  return {
    ...meta, tl: oneTL, mat: true, poster: 0.18,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'near', scale: 0.9 }, { m: 'delts', side: 'near', scale: 0.7 }, { m: 'abs', scale: 0.62 }],
    pose(t) {
      const p = oneTL.at(t).p;
      return basePlank(p,
        plantedArm(add(HIGH_PLANK.wrist, [-20, 0]) as Vec2),
        { target: (J) => add(J.Sf, [-108, 3]), side: [-1, 0], hand: 180 });
    },
  } satisfies SideExercise;
}

/** A side-view press keeps both palms planted, with the torso drifting over the working-side elbow. */
export function sideToSide(meta: PushMeta): SideExercise {
  const sideTL = timeline([
    { d: 1.1, from: -1, to: 1, e: [0.5, 1] }, { d: 0.25, from: 1, to: 1, e: [1, 0.75] },
    { d: 1.1, from: 1, to: -1, e: [0.75, 1] }, { d: 0.25, from: -1, to: -1, e: [1, 0.5] },
  ]);
  return {
    ...meta, tl: sideTL, mat: true, poster: 0.18,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.68 }, { m: 'delts', side: 'both', scale: 0.52 }, { m: 'abs', scale: 0.48 }],
    pose(t) {
      const q = sideTL.at(t).p;
      const p = 0.45 + 0.55 * Math.abs(q);
      const near = plantedArm(add(HIGH_PLANK.wrist, [q * 16, 0]) as Vec2);
      const far = plantedArm(add(HIGH_PLANK.wristFar, [q * 9, 0]) as Vec2);
      return basePlank(p, near, far);
    },
  } satisfies SideExercise;
}

/** Wide-front prone view, used when hand width or lateral weight shift is the defining cue. */
export function frontPlank(
  meta: PushMeta,
  useTL = tl,
  shape: (p: number) => { shift?: number; leftBend?: number; rightBend?: number; leftReach?: number; rightReach?: number } = (p) => ({ leftBend: p, rightBend: p }),
  opts: { kettlebell?: boolean; kick?: boolean; sidePlank?: boolean; archer?: boolean } = {},
): FrontExercise {
  const normal = useTL === tl;
  return {
    ...meta, view: 'front', tl: useTL, mat: true, poster: normal ? 0 : 0.2,
    meta: { en: meta.en, family: 'push-up', equipment: opts.kettlebell ? ['bodyweight', 'kettlebell'] : ['bodyweight'], sources: meta.sources },
    muscles: [
      { m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.64, region: { view: 'front', part: 'upper', c: [0, 34], s: [12, 34] } },
      { m: 'delts', side: 'both', scale: 0.46 }, { m: 'abs', scale: opts.kick || opts.sidePlank ? 0.62 : 0.4 },
      ...(opts.kick ? [{ m: 'glutes' as const, scale: 0.8, region: { view: 'front' as const, part: 'pelvis' as const, c: [18, 0] as Vec2, s: [18, 18] as Vec2, mirror: true } }] : []),
    ],
    dynamic: opts.kettlebell ? [kettlebell<FrontJoints>(() => ({ p: [-62, FLOOR - KETTLEBELL.height], a: 0 }), 'face', 'back')] : undefined,
    pose(t) {
      const phase = useTL.at(t);
      const s = shape(phase.p);
      const bendL = s.leftBend ?? phase.p;
      const bendR = s.rightBend ?? phase.p;
      const pelvisY = lerp(103, 58, (bendL + bendR) / 2);
      const spreadL = 62 + (s.leftReach ?? 0);
      const spreadR = -62 - (s.rightReach ?? 0);
      const ankleL: [number, number, number] = [42, 13, opts.kick ? lerp(-266, -138, phase.p) : -266];
      const ankleR: [number, number, number] = [-42, 13, -266];
      return {
        pelvis: [s.shift ?? 0, pelvisY, -110],
        hips: { pitch: 76 }, spine: {}, neck: { pitch: 0 }, head: { pitch: 0 },
        legs: {
          l: { target: ankleL, pole: [1, 0, 0], dir: toeDir([0, 0, -1]) },
          r: { target: ankleR, pole: [-1, 0, 0], dir: toeDir([0, 0, -1]) },
        },
        arms: {
          l: { target: [spreadL, lerp(13, 13, bendL), 35], pole: [0, 0, 1], dir: [0, -1, 0] },
          r: { target: [spreadR, lerp(13, 13, bendR), 35], pole: [0, 0, 1], dir: [0, -1, 0] },
        },
      };
    },
  } satisfies FrontExercise;
}

export const inclineStep = aerobicStep({ x: 366, h: 72, w: 174 });
/** Incline push-up on the step: p = 0 is the top with straight arms, p = 1 the bottom. */
export function inclinePose(p: number, reverse = false): Pose {
  // Both legs stay essentially straight. The trunk rotates as one unit around the fixed toes.
  const th = lerp(-30, -10, p);
  const ankle: Vec2 = [174, G - 41];
  const hip = add(ankle, mul(dir(th), BODY.thigh + BODY.shin - 3));
  const spine = { lumbar: th, thoracic: th - 1 };
  const wrist: Vec2 = [356, inclineStep.top - 7];
  return {
    hip, spine, neck: th - 4, head: th - 1, farHip: 0, farShoulder: 0,
    legs: {
      near: { target: ankle, side: [0, 1], foot: 85 },
      far: { target: [177, G - 41], side: [0, 1], foot: 85 },
    },
    arms: {
      near: { target: wrist, side: [-1, 0], hand: reverse ? 180 : 0 },
      far: { target: [wrist[0] - 3, wrist[1]], side: [-1, 0], hand: reverse ? 180 : 0 },
    },
  };
}

/** Fixed elevated hand support, with feet remaining on the floor and chest travelling to the edge. */
export function inclinePush(meta: PushMeta, opts: { close?: boolean; reverse?: boolean } = {}): SideExercise {
  return {
    ...meta, tl, mat: true, poster: 0,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight', 'step'], sources: meta.sources },
    muscles: opts.close
      ? [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.62 }, { m: 'delts', side: 'both', scale: 0.4 }]
      : [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.62 }, { m: 'delts', side: 'both', scale: 0.42 }],
    props: (pal) => ({ back: inclineStep.draw(pal) }), propsBox: [174, inclineStep.box[1]],
    pose: (t) => inclinePose(tl.at(t).p, opts.reverse),
  } satisfies SideExercise;
}

const declineBox = plyoBox({ x: 122, h: 82, w: 126 });
/** Feet on a box and hands on the floor. The torso remains one line, while the fixed contacts set elbow depth. */
export function declinePush(meta: PushMeta): SideExercise {
  const ankle: Vec2 = [120, declineBox.top - 41];
  const body = (th: number): Omit<Pose, 'arms'> => ({
    hip: add(ankle, mul(dir(th), BODY.thigh + BODY.shin - 3)),
    spine: { lumbar: th, thoracic: th - 1 }, neck: th - 4, head: th + 2, farHip: 0, farShoulder: 0,
    legs: { near: { target: ankle, side: [0, 1], foot: 85 }, far: { target: add(ankle, [-2, 0]) as Vec2, side: [0, 1], foot: 85 } },
  });
  const wristFor = (th: number): Vec2 => {
    const probe = baseProbe(body(th));
    return [probe.S[0] + 6, WRIST_Y];
  };
  // A 4° top keeps the elevated toes, trunk and floor palms within arm reach. The bottom is reached by a soft hip hinge.
  const top = 4, bottom = 15;
  return {
    ...meta, tl, mat: true, poster: 0,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight', 'box'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.65 }, { m: 'delts', side: 'both', scale: 0.55 }, { m: 'abs', scale: 0.4 }],
    props: (pal) => ({ back: declineBox.draw(pal) }), propsBox: declineBox.box,
    pose(t) {
      const th = lerp(top, bottom, tl.at(t).p);
      const wrist = wristFor(top);
      // Bend the elbows toward the body line rather than below the fixed floor palms at the deep position.
      return {
        ...body(th),
        arms: {
          near: { target: wrist, side: [0, -1], hand: 0 },
          far: { target: add(wrist, [-3, 0]) as Vec2, side: [0, -1], hand: 0 },
        },
      };
    },
  } satisfies SideExercise;
}

function baseProbe(body: Omit<Pose, 'arms'>): Joints {
  // The temporary vertical arms only measure the shoulder location. They never enter the rendered pose.
  return solve({ ...body, arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } } });
}

/** Kneeling push-up: knees remain the base and the torso travels as one rigid line toward the palms. */
export function kneelingPush(meta: PushMeta, close = false): SideExercise {
  const knee: Vec2 = [205, FLOOR - 11];
  const pose = (p: number): Pose => {
    const hip: Vec2 = [lerp(278, 292, p), lerp(347, 380, p)];
    const th = lerp(-18, -5, p);
    const armW: Vec2 = [392, WRIST_Y];
    const leg = (): LimbSpec => ({ a1: ang(sub(knee, hip)), a2: -12, foot: 180 });
    return {
      hip, spine: { lumbar: th, thoracic: th - 1 }, neck: th - 4, head: th + 2, farHip: 0, farShoulder: 0,
      legs: { near: leg(), far: leg() },
      arms: {
        near: { target: close ? add(armW, [-7, 0]) as Vec2 : armW, side: [-1, 0], hand: 0 },
        far: { target: close ? add(armW, [-10, 0]) as Vec2 : add(armW, [-3, 0]) as Vec2, side: [-1, 0], hand: 0 },
      },
    };
  };
  return {
    ...meta, tl, mat: true, poster: 0,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: close
      ? [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.6 }, { m: 'delts', side: 'both', scale: 0.4 }]
      : [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.65 }, { m: 'delts', side: 'both', scale: 0.46 }],
    pose: (t) => pose(tl.at(t).p),
  } satisfies SideExercise;
}

/** A controlled forearm-to-palm transition with elbows fixed under the shoulders at the low position. */
export function forearmPush(meta: PushMeta): SideExercise {
  const transition = timeline([
    { d: 1.0, from: 0, to: 1, e: [0.45, 0.9] }, { d: 0.45, from: 1, to: 1, e: [0.9, 0.75] },
    { d: 1.2, from: 1, to: 0, e: [0.75, 0.4] }, { d: 0.45, from: 0, to: 0, e: [0.4, 0.35] },
  ]);
  return {
    ...meta, tl: transition, mat: true, poster: 0.2,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'forearms', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.68 }, { m: 'pecs', scale: 0.6 }, { m: 'delts', side: 'both', scale: 0.45 }],
    pose(t) {
      const p = transition.at(t).p;
      const body = HIGH_PLANK.body(lerp(HIGH_PLANK.top, -7, p));
      const arm = (far = false): LimbSpec => p < 0.12
        ? { a1: 90, a2: far ? -2 : 0, hand: 0 }
        : { target: far ? HIGH_PLANK.wristFar : HIGH_PLANK.wrist, side: [-1, 0], hand: 0 };
      return { ...body, arms: { near: arm(), far: arm(true) } };
    },
  } satisfies SideExercise;
}

/** Planche pressing balances on the hands; the fully straight legs remain clear of the floor. */
export function planchePush(meta: PushMeta): SideExercise {
  const plancheTL = workTL(0.22);
  const pose = (p: number): Pose => {
    const th = -8;
    const S: Vec2 = [342, lerp(316, 366, p)];
    const spine = { lumbar: th, thoracic: th };
    const hip = hipForShoulder(S, spine);
    return {
      hip, spine, neck: th - 3, head: th + 1, farHip: 0, farShoulder: 0,
      legs: { near: { a1: 180, a2: 180, foot: 180 }, far: { a1: 180, a2: 180, foot: 180 } },
      arms: { near: { target: [342, WRIST_Y], side: [-1, 0], hand: 0 }, far: { target: [339, WRIST_Y], side: [-1, 0], hand: 0 } },
    };
  };
  return {
    ...meta, tl: plancheTL, mat: true, poster: 0,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'delts', side: 'both', scale: 0.9 }, { m: 'triceps', side: 'both', scale: 0.75 }, { m: 'abs', scale: 0.72 }],
    pose: (t) => pose(plancheTL.at(t).p),
  } satisfies SideExercise;
}

/** Pike to cobra: the hips first rise behind the shoulders, then the chest glides forward into an extended-arm cobra. */
export function pikeCobra(meta: PushMeta, modified = false): SideExercise {
  const wave = timeline([
    { d: 1.25, from: 0, to: 1, e: [0.45, 0.95] }, { d: 0.35, from: 1, to: 1, e: [0.95, 0.75] },
    { d: 1.4, from: 1, to: 0, e: [0.75, 0.42] }, { d: 0.45, from: 0, to: 0, e: [0.42, 0.35] },
  ]);
  const pose = (p: number): Pose => {
    const hip: Vec2 = modified ? [lerp(300, 278, p), lerp(300, 391, p)] : [lerp(280, 318, p), lerp(245, 398, p)];
    const th = lerp(-55, modified ? -5 : 10, p);
    const ankle: Vec2 = [120, FLOOR - 41];
    return {
      hip, spine: { lumbar: th, thoracic: th - (modified ? 2 : 7) }, neck: th - 7, head: th - 2, farHip: 0, farShoulder: 0,
      legs: { near: { target: ankle, side: [0, 1], foot: 85 }, far: { target: add(ankle, [-2, 0]) as Vec2, side: [0, 1], foot: 85 } },
      arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) },
    };
  };
  return {
    ...meta, tl: wave, mat: true, poster: 0.28,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'delts', side: 'both', scale: 0.7 }, { m: 'triceps', side: 'both', scale: 0.65 }, { m: 'abs', scale: 0.55 }, { m: 'glutes', scale: 0.38 }],
    pose: (t) => pose(wave.at(t).p),
  } satisfies SideExercise;
}

/** Plyometric push-up moves both palms off the mat for a visible clap, then returns to a soft landing. */
export function clapPush(meta: PushMeta): SideExercise {
  const plyo = timeline([
    { d: 0.55, from: 0, to: 1, e: [0.4, 0.9] }, { d: 0.2, from: 1, to: 2, e: [0.9, 1] },
    { d: 0.25, from: 2, to: 1, e: [1, 0.8] }, { d: 0.65, from: 1, to: 0, e: [0.8, 0.35] }, { d: 0.35, from: 0, to: 0, e: [0.35, 0.3] },
  ]);
  return {
    ...meta, tl: plyo, mat: true, poster: 0.35,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.75 }, { m: 'delts', side: 'both', scale: 0.55 }],
    pose(t) {
      const q = plyo.at(t).p;
      if (q < 1) return basePlank(q);
      const air = q - 1;
      const th = lerp(HIGH_PLANK.top, HIGH_PLANK.top - 5, air);
      return {
        ...HIGH_PLANK.body(th),
        arms: {
          near: { target: (J) => add(J.S, [32, 56 - 70 * air]), side: [-1, 0], hand: 0 },
          far: { target: (J) => add(J.Sf, [28, 56 - 70 * air]), side: [-1, 0], hand: 0 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Side-lying press: the lower palm drives the straight, stacked body away from the mat. */
export function sideLyingPush(meta: PushMeta): SideExercise {
  return {
    ...meta, tl, mat: true, poster: 0,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'triceps', side: 'near' }, { m: 'delts', side: 'near', scale: 0.65 }, { m: 'pecs', scale: 0.5 }, { m: 'abs', scale: 0.45 }],
    pose(t) {
      const p = tl.at(t).p;
      const spine = { lumbar: 0, thoracic: 0 };
      const S: Vec2 = [342, lerp(315, 375, p)];
      const hip = hipForShoulder(S, spine);
      return {
        hip, spine, neck: -2, head: 0, farHip: 0, farShoulder: 0,
        legs: { near: { a1: 180, a2: 180, foot: 180 }, far: { a1: 180, a2: 180, foot: 180 } },
        arms: {
          near: { target: [342, WRIST_Y], side: [-1, 0], hand: 0 },
          far: { target: (J) => add(J.Sf, [4, -118]), side: [-1, 0], hand: -90 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Clock push-up uses the same lateral chest path as an archer press, then travels to the opposite clock position. */
export function clockPush(meta: PushMeta): SideExercise {
  const clockTL = timeline([
    { d: 0.65, from: 0, to: 1, e: [0.4, 1] }, { d: 0.25, from: 1, to: 1, e: [1, 0.9] },
    { d: 0.45, from: 1, to: -0.25, e: [0.9, 0.7] }, { d: 0.65, from: -0.25, to: -1, e: [0.7, 1] },
    { d: 0.25, from: -1, to: -1, e: [1, 0.8] }, { d: 0.45, from: -1, to: 0, e: [0.8, 0.4] },
  ]);
  return {
    ...meta, tl: clockTL, mat: true, poster: 0.16,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.68 }, { m: 'delts', side: 'both', scale: 0.5 }, { m: 'abs', scale: 0.42 }],
    pose(t) {
      const q = clockTL.at(t).p;
      const p = Math.min(1, Math.abs(q));
      return basePlank(p, plantedArm(add(HIGH_PLANK.wrist, [q * 20, 0]) as Vec2), plantedArm(add(HIGH_PLANK.wristFar, [q * 14, 0]) as Vec2));
    },
  } satisfies SideExercise;
}

/** Press to side plank: one palm remains planted while the other hand opens the chest above the shoulder. */
export function sidePlankPush(meta: PushMeta, alternate: boolean): SideExercise {
  const turnTL = timeline([
    { d: 0.8, from: 0, to: 1, e: [0.35, 0.95] }, { d: 0.2, from: 1, to: 1, e: [0.95, 0.8] },
    { d: 0.75, from: 1, to: 0, e: [0.8, 0.5] }, { d: 0.6, from: 0, to: 2, e: [0.5, 0.9] },
    { d: 0.35, from: 2, to: 2, e: [0.9, 0.65] }, { d: 0.55, from: 2, to: 0, e: [0.65, 0.35] },
  ]);
  return {
    ...meta, tl: turnTL, mat: true, poster: 0.62,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.62 }, { m: 'obliques', scale: 0.72 }, { m: 'delts', side: 'both', scale: 0.58 }],
    pose(t) {
      const phase = turnTL.at(t);
      const reach = Math.max(0, phase.p - 1);
      const push = reach > 0 ? 0 : phase.p;
      const nearTurn = !alternate || t < 0.5;
      const open = (far: boolean): LimbSpec => ({ target: (J) => add(far ? J.Sf : J.S, [7, -118 * reach]), side: [-1, 0], hand: -90 });
      return basePlank(push,
        nearTurn ? open(false) : plantedArm(HIGH_PLANK.wrist),
        nearTurn ? plantedArm(HIGH_PLANK.wristFar) : open(true));
    },
  } satisfies SideExercise;
}

/** Alternate the side-kicking leg only after the press reaches long arms. */
export function sideKickPush(meta: PushMeta): SideExercise {
  const kickTL = timeline([
    { d: 0.9, from: 0, to: 1, e: [0.35, 0.9] }, { d: 0.3, from: 1, to: 1, e: [0.9, 1] },
    { d: 0.8, from: 1, to: 0, e: [1, 0.45] }, { d: 0.9, from: 0, to: 1, e: [0.45, 0.9] },
    { d: 0.3, from: 1, to: 1, e: [0.9, 1] }, { d: 0.8, from: 1, to: 0, e: [1, 0.35] },
  ]);
  return {
    ...meta, tl: kickTL, mat: true, poster: 0.16,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.62 }, { m: 'glutes', scale: 0.85 }, { m: 'abs', scale: 0.55 }],
    pose(t) {
      const phase = kickTL.at(t);
      const q = phase.p > 0.72 ? smooth((phase.p - 0.72) / 0.28) : 0;
      const nearKick = t < 0.5;
      const p = Math.min(1, phase.p);
      const leg = (far: boolean): LimbSpec => (!far === nearKick && q > 0.02)
        ? { a1: lerp(HIGH_PLANK.body(HIGH_PLANK.top).legs.near.a1 ?? 180, -18, q), a2: -18, foot: -35 }
        : HIGH_PLANK.body(lerp(HIGH_PLANK.top, HIGH_PLANK.bottom, p)).legs[far ? 'far' : 'near'];
      return {
        ...HIGH_PLANK.body(lerp(HIGH_PLANK.top, HIGH_PLANK.bottom, p)), legs: { near: leg(false), far: leg(true) },
        arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) },
      };
    },
  } satisfies SideExercise;
}

/** One hand meets the kettlebell handle while the other lands on the floor, then the contacts switch. */
export function kettlebellPlyoPush(meta: PushMeta): SideExercise {
  const plyoTL = timeline([
    { d: 0.7, from: 0, to: 1, e: [0.4, 1] }, { d: 0.18, from: 1, to: 2, e: [1, 1] },
    { d: 0.42, from: 2, to: 0, e: [1, 0.5] }, { d: 0.7, from: 0, to: 1, e: [0.5, 1] },
    { d: 0.18, from: 1, to: 2, e: [1, 1] }, { d: 0.42, from: 2, to: 0, e: [1, 0.4] },
  ]);
  return {
    ...meta, tl: plyoTL, mat: true, poster: 0.2,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight', 'kettlebell'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.7 }, { m: 'delts', side: 'both', scale: 0.55 }, { m: 'abs', scale: 0.42 }],
    dynamic: [kettlebell<Joints>(() => ({ p: [HIGH_PLANK.wrist[0] - 12, FLOOR - KETTLEBELL.height], a: 0 }), 'face', 'back')],
    pose(t) {
      const phase = plyoTL.at(t);
      const p = Math.min(1, phase.p);
      const swap = t >= 0.5;
      const bell: Vec2 = [HIGH_PLANK.wrist[0] - 12, FLOOR - KETTLEBELL.height];
      return {
        ...HIGH_PLANK.body(lerp(HIGH_PLANK.top, HIGH_PLANK.bottom, p)),
        arms: {
          near: swap ? plantedArm(HIGH_PLANK.wrist) : { target: bell, side: [-1, 0], hand: 0 },
          far: swap ? { target: add(bell, [-3, 0]) as Vec2, side: [-1, 0], hand: 0 } : plantedArm(HIGH_PLANK.wristFar),
        },
      };
    },
  } satisfies SideExercise;
}

/** Lower in a full plank, place both knees on the mat, then press back to the original high plank. */
export function kneeDropPush(meta: PushMeta): SideExercise {
  const dropTL = timeline([
    { d: 0.9, from: 0, to: 1, e: [0.4, 0.95] }, { d: 0.25, from: 1, to: 1, e: [0.95, 0.85] },
    { d: 0.25, from: 1, to: 2, e: [0.85, 0.9] }, { d: 0.85, from: 2, to: 0, e: [0.9, 0.4] }, { d: 0.4, from: 0, to: 0, e: [0.4, 0.35] },
  ]);
  const kneel = kneelingPush(meta);
  return {
    ...kneel, tl: dropTL, poster: 0.23,
    pose(t) {
      const p = dropTL.at(t).p;
      if (p <= 1) return basePlank(p);
      return kneel.pose((p - 1) / 1);
    },
  } satisfies SideExercise;
}

/** Alternate close and wide palm offsets while retaining a clear side-profile push-up. */
export function closeWidePush(meta: PushMeta): SideExercise {
  const widthTL = timeline([
    { d: 0.85, from: 0, to: 1, e: [0.4, 0.95] }, { d: 0.3, from: 1, to: 1, e: [0.95, 0.7] },
    { d: 0.55, from: 1, to: 0, e: [0.7, 0.4] }, { d: 0.85, from: 0, to: 1, e: [0.4, 0.95] },
    { d: 0.3, from: 1, to: 1, e: [0.95, 0.7] }, { d: 0.55, from: 1, to: 0, e: [0.7, 0.4] },
  ]);
  return {
    ...meta, tl: widthTL, mat: true, poster: 0,
    meta: { en: meta.en, family: 'push-up', equipment: ['bodyweight'], sources: meta.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.66 }, { m: 'delts', side: 'both', scale: 0.48 }],
    pose(t) {
      const close = t < 0.5;
      const p = widthTL.at(t).p;
      const offset = close ? -8 : 22;
      return basePlank(p, plantedArm(add(HIGH_PLANK.wrist, [offset, 0]) as Vec2), plantedArm(add(HIGH_PLANK.wristFar, [offset, 0]) as Vec2));
    },
  } satisfies SideExercise;
}

/** The side profile shows the close, centered hand position that identifies the diamond push-up. */
export function diamondPush(meta: PushMeta): SideExercise {
  return floorPush(meta, { close: true });
}
