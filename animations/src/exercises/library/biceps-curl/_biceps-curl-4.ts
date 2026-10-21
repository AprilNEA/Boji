// Shared side-view curl builders for biceps-curl-4.
// The builders keep the working upper arm fixed and use a 165° to 45° elbow range.
// They keep planted feet, seats, balls and bench pads static while the dumbbells follow the hands.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { type LimbPair, type Pose } from '@/rig/side.ts';
import { A, G, handOnHip, standLegs } from '@/exercises/common.ts';
import { BALL, dumbbell, flatBench, inclineBench, preacherBench, stabilityBall, workTL } from '@/exercises/equipment/index.ts';

type Grip = 'supinated' | 'hammer' | 'reverse';

type CurlConfig = {
  id: string;
  name: string;
  en: string;
  sources: string[];
  grip?: Grip;
  bilateral?: boolean;
};

const viewFor = (grip: Grip) => grip === 'hammer' ? 'profile' : 'end';
const curlForearm = (p: number, upper = 90): number => lerp(upper + 15, upper - 135, p);
const curlArm = (p: number, upper = 90) => ({ a1: upper, a2: curlForearm(p, upper), hand: curlForearm(p, upper) });
const curlMuscles = (bilateral: boolean) => [
  { m: 'biceps' as const, side: bilateral ? 'both' as const : 'near' as const },
  { m: 'forearms' as const, side: bilateral ? 'both' as const : 'near' as const, scale: 0.45 },
];

const STAND_HIP: Vec2 = [250, 256];
const standBase = {
  hip: STAND_HIP,
  spine: { lumbar: -90, thoracic: -90 },
  neck: -90,
  head: -90,
  legs: standLegs(STAND_HIP[0], 0),
};

/** Standing curl: the torso is tall, elbows remain beside it, and only the forearms rotate. */
export function makeStandingCurl(config: CurlConfig): SideExercise {
  const grip = config.grip ?? 'supinated';
  const bilateral = config.bilateral ?? false;
  const tl = workTL(0.3);
  return {
    id: config.id, name: config.name, tl,
    meta: { en: config.en, family: 'biceps-curl', equipment: ['dumbbell'], sources: config.sources },
    muscles: curlMuscles(bilateral),
    dynamic: bilateral
      ? [dumbbell('f', viewFor(grip)), dumbbell('n', viewFor(grip))]
      : [dumbbell('n', viewFor(grip))],
    pose(t): Pose {
      const arm = curlArm(tl.at(t).p);
      return {
        ...standBase,
        arms: { near: arm, far: bilateral ? arm : handOnHip(-5) },
      };
    },
  };
}

const BALL_HIP: Vec2 = [220, 348];
const ballLegs: LimbPair = {
  near: { target: [320, G - A], foot: 0, side: [0, -1] },
  far: { target: [314, G - A], foot: 0, side: [0, -1] },
};
const ballBase = {
  hip: BALL_HIP,
  spine: { lumbar: -90, thoracic: -90 },
  neck: -90,
  head: -90,
  legs: ballLegs,
};

/** Seated stability-ball curl: both feet stay flat unless the source explicitly requires a raised leg. */
export function makeBallCurl(config: CurlConfig & { alternate?: boolean; raisedLeg?: boolean; concentration?: boolean }): SideExercise {
  const grip = config.grip ?? 'supinated';
  const bilateral = config.bilateral ?? false;
  const normalTL = workTL(0.3);
  const altTL = timeline([{ d: 6, from: 0, to: 0, e: [0.45, 0.45] }]);
  const wave = (t: number): number => {
    const u = ((t % 1) + 1) % 1;
    if (u < 0.26) return u / 0.26;
    if (u < 0.36) return 1;
    if (u < 0.78) return 1 - (u - 0.36) / 0.42;
    return 0;
  };
  const tl = config.alternate ? altTL : normalTL;
  const raisedLegs: LimbPair = {
    near: { a1: 18, a2: 0, foot: 0 },
    far: ballLegs.far,
  };
  const concentrationBase = {
    hip: BALL_HIP,
    spine: { lumbar: -60, thoracic: -60 },
    neck: -60,
    head: -60,
    legs: ballLegs,
  };
  return {
    id: config.id, name: config.name, tl,
    meta: {
      en: config.en, family: 'biceps-curl',
      equipment: ['dumbbell', 'stability-ball'], sources: config.sources,
    },
    muscles: [
      { m: 'biceps', side: bilateral ? 'both' : 'near', e: config.alternate ? (t) => Math.max(wave(t), wave(t + 0.5)) : undefined },
      { m: 'forearms', side: bilateral ? 'both' : 'near', scale: 0.45, e: config.alternate ? (t) => 0.2 + 0.6 * Math.max(wave(t), wave(t + 0.5)) : undefined },
    ],
    propsBox: [BALL_HIP[0] - BALL.r, BALL_HIP[0] + BALL.r],
    dynamic: [
      stabilityBall(() => ({ p: [BALL_HIP[0], G - BALL.r] })),
      ...(bilateral ? [dumbbell('f', viewFor(grip)), dumbbell('n', viewFor(grip))] : [dumbbell('n', viewFor(grip))]),
    ],
    pose(t): Pose {
      const p = config.alternate ? wave(t) : normalTL.at(t).p;
      const q = config.alternate ? wave(t + 0.5) : p;
      if (config.concentration) {
        const working = curlArm(p, 60);
        return {
          ...concentrationBase,
          arms: { near: working, far: handOnHip(-6) },
        };
      }
      const near = curlArm(p);
      const far = curlArm(q);
      return {
        ...ballBase,
        legs: config.raisedLeg ? raisedLegs : ballLegs,
        arms: { near, far: bilateral ? far : handOnHip(-5) },
      };
    },
  };
}

const PREACHER = (() => {
  const bench = preacherBench({ x: 254, y: 244, seatX: 238, seatTop: 96, facing: 1 });
  const base = {
    hip: [238, 356] as Vec2,
    spine: { lumbar: -90, thoracic: -90 },
    neck: -90,
    head: -90,
    shoulderShift: -15,
    legs: {
      near: { target: [338, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
      far: { target: [332, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
    },
  };
  return { bench, base };
})();

/** Preacher curl: the upper arm follows the pad at 45° and the elbow stays on the pad throughout. */
export function makePreacherCurl(config: CurlConfig): SideExercise {
  const grip = config.grip ?? 'supinated';
  const bilateral = config.bilateral ?? false;
  const tl = workTL(0.35);
  return {
    id: config.id, name: config.name, tl,
    meta: { en: config.en, family: 'biceps-curl', equipment: ['dumbbell', 'bench'], sources: config.sources },
    muscles: curlMuscles(bilateral),
    props: (pal) => ({ back: PREACHER.bench.draw(pal) }),
    propsBox: PREACHER.bench.box,
    dynamic: bilateral
      ? [dumbbell('f', viewFor(grip)), dumbbell('n', viewFor(grip))]
      : [dumbbell('n', viewFor(grip))],
    pose(t): Pose {
      const arm = curlArm(tl.at(t).p, 45);
      return {
        ...PREACHER.base,
        arms: { near: arm, far: bilateral ? arm : handOnHip(-10) },
      };
    },
  };
}

const STANDING_PREACHER = (() => {
  const bench = preacherBench({ x: 250, y: 150, seatX: 238, seatTop: 96, facing: 1 });
  const base = {
    hip: [240, 256] as Vec2,
    spine: { lumbar: -90, thoracic: -90 },
    neck: -90,
    head: -90,
    legs: standLegs(240, 0),
  };
  return { bench, base };
})();

/** Standing preacher curl: both upper arms lie along the high pad while the torso and planted feet stay still. */
export function makeStandingPreacherCurl(config: CurlConfig): SideExercise {
  const tl = workTL(0.35);
  return {
    id: config.id, name: config.name, tl,
    meta: { en: config.en, family: 'biceps-curl', equipment: ['dumbbell', 'bench'], sources: config.sources },
    muscles: curlMuscles(true),
    props: (pal) => ({
      back: [
        ...STANDING_PREACHER.bench.draw(pal),
        // A standing preacher bench needs a broad, visible arm pad. It stays behind the upper arms at their 45° line.
        { kind: 'box', nm: 'standing-preacher-wide-pad', color: pal.pad, c: [278, 188], s: [28, 100], r: 7, rot: -45 },
      ],
    }),
    propsBox: STANDING_PREACHER.bench.box,
    dynamic: [dumbbell('f', 'end'), dumbbell('n', 'end')],
    pose(t): Pose {
      const arm = curlArm(tl.at(t).p, 45);
      return { ...STANDING_PREACHER.base, arms: { near: arm, far: arm } };
    },
  };
}

const PRONE_FLAT = (() => {
  const bench = flatBench({ view: 'side', x: 180, top: 108, length: 270 });
  const base = {
    hip: [170, 316] as Vec2,
    spine: { lumbar: 0, thoracic: 0 },
    neck: 0,
    head: 0,
    legs: {
      near: { a1: 180, a2: 180, foot: 180 },
      far: { a1: 180, a2: 180, foot: 180 },
    },
  };
  return { bench, base };
})();

/** Prone flat-bench curl: chest and stomach are supported, with the working upper arm vertical and still. */
export function makeProneFlatCurl(config: CurlConfig): SideExercise {
  const grip = config.grip ?? 'supinated';
  const tl = workTL(0.3);
  return {
    id: config.id, name: config.name, tl,
    meta: { en: config.en, family: 'biceps-curl', equipment: ['dumbbell', 'bench'], sources: config.sources },
    muscles: curlMuscles(false),
    props: (pal) => ({ back: PRONE_FLAT.bench.draw(pal) }),
    propsBox: PRONE_FLAT.bench.box,
    dynamic: [dumbbell('n', viewFor(grip))],
    pose(t): Pose {
      return {
        ...PRONE_FLAT.base,
        arms: { near: curlArm(tl.at(t).p), far: { a1: 90, a2: 90, hand: 90 } },
      };
    },
  };
}

const PRONE_INCLINE = (() => {
  // The backrest rises toward screen right. With the torso facing right, its anterior chest surface meets the pad;
  // `facing: -1` prevents the prior, visibly supine placement where the back touched the pad.
  const bench = inclineBench({ x: 230, angle: 45, back: 170, facing: -1 });
  const base = {
    hip: [220, 347] as Vec2,
    spine: { lumbar: -45, thoracic: -45 },
    neck: -45,
    head: -45,
    legs: {
      // The legs extend behind the inclined chest support; floor contact is not a fixed point in this supported pose.
      near: { a1: 180, a2: 180, foot: 180 },
      far: { a1: 180, a2: 180, foot: 180 },
    },
  };
  return { bench, base };
})();

/** Incline spider curl: the chest stays against a 45° pad while both upper arms hang straight down. */
export function makeSpiderCurl(config: CurlConfig): SideExercise {
  const grip = config.grip ?? 'supinated';
  const bilateral = config.bilateral ?? true;
  const tl = workTL(0.35);
  return {
    id: config.id, name: config.name, tl,
    meta: { en: config.en, family: 'biceps-curl', equipment: ['dumbbell', 'bench'], sources: config.sources },
    muscles: curlMuscles(bilateral),
    props: (pal) => ({ back: PRONE_INCLINE.bench.draw(pal) }),
    propsBox: PRONE_INCLINE.bench.box,
    dynamic: bilateral
      ? [dumbbell('f', viewFor(grip)), dumbbell('n', viewFor(grip))]
      : [dumbbell('n', viewFor(grip))],
    pose(t): Pose {
      const arm = curlArm(tl.at(t).p);
      return {
        ...PRONE_INCLINE.base,
        arms: { near: arm, far: bilateral ? arm : { a1: 90, a2: 90, hand: 90 } },
      };
    },
  };
}

/** Bent-over concentration curl: hips hinge about 40° while the arm hangs perpendicular to the floor. */
export function makeStandingConcentrationCurl(config: CurlConfig): SideExercise {
  const grip = config.grip ?? 'supinated';
  const tl = workTL(0.3);
  const base = {
    hip: [230, 260] as Vec2,
    spine: { lumbar: -50, thoracic: -50 },
    neck: -50,
    head: -50,
    legs: standLegs(250, 0),
  };
  return {
    id: config.id, name: config.name, tl,
    meta: { en: config.en, family: 'biceps-curl', equipment: ['dumbbell'], sources: config.sources },
    muscles: curlMuscles(false),
    dynamic: [dumbbell('n', viewFor(grip))],
    pose(t): Pose {
      return {
        ...base,
        arms: {
          near: curlArm(tl.at(t).p),
          // Brace the palm on the upper thigh. A knee target would be beyond the far arm's reach in this deep hinge.
          far: { target: (J) => add(J.Hf, [28, 32]), hand: 90, side: [-1, 0] },
        },
      };
    },
  };
}

const SUPPORT_BENCH = (() => {
  // This elevated 60° pad puts the chest and upper arm on the same face.
  // The standing athlete faces the pad from its low side, rather than curling beside it.
  const bench = inclineBench({ x: 276, angle: 60, top: 154, back: 165, facing: 1 });
  const base = {
    hip: [140, 256] as Vec2,
    spine: { lumbar: -60, thoracic: -60 },
    neck: -60,
    head: -60,
    legs: standLegs(140, 0),
    // A forward lean shifts the default far hip upward beyond straight-leg reach.
    farHip: 0,
  };
  return { bench, base };
})();

/** Standing incline-bench curl: the chest, upper arm and free hand stay against the incline while the elbow flexes. */
export function makeStandingInclinePreacherCurl(config: CurlConfig): SideExercise {
  const tl = workTL(0.3);
  return {
    id: config.id, name: config.name, tl,
    meta: { en: config.en, family: 'biceps-curl', equipment: ['dumbbell', 'bench'], sources: config.sources },
    muscles: curlMuscles(false),
    props: (pal) => ({ back: SUPPORT_BENCH.bench.draw(pal) }),
    propsBox: SUPPORT_BENCH.bench.box,
    dynamic: [dumbbell('n', 'end')],
    pose(t): Pose {
      return {
        ...SUPPORT_BENCH.base,
        arms: {
          // The 30° upper arm follows the 60° incline surface from its upper edge.
          near: curlArm(tl.at(t).p, 30),
          far: { target: [233, 196], hand: 30, side: [1, 0] },
        },
      };
    },
  };
}

/** Alternating hammer curl to press: each arm curls separately, then each arm presses overhead in sequence. */
export function makeAlternatingCurlToPress(config: CurlConfig): SideExercise {
  const tl = timeline([{ d: 10, from: 0, to: 0, e: [0.35, 0.35] }]);
  /** One complete raise, hold and controlled return. `start` orders right curl, left curl, right press, left press. */
  const pulse = (t: number, start: number): number => {
    const u = ((t - start + 1) % 1 + 1) % 1;
    if (u < 0.09) return u / 0.09;
    if (u < 0.12) return 1;
    if (u < 0.25) return 1 - (u - 0.12) / 0.13;
    return 0;
  };
  const stage = (t: number, side: 'near' | 'far'): { curl: number; press: number } => ({
    curl: pulse(t, side === 'near' ? 0 : 0.25),
    press: pulse(t, side === 'near' ? 0.5 : 0.75),
  });
  const arm = (curl: number, press: number) => {
    if (press > 0) {
      // Start at shoulder height then extend overhead with the arm nearly straight.
      const shoulder = { a1: lerp(90, -88, press), a2: lerp(-45, -88, press), hand: -88 };
      return shoulder;
    }
    return curlArm(curl);
  };
  return {
    id: config.id, name: config.name, tl,
    meta: { en: config.en, family: 'biceps-curl', equipment: ['dumbbell'], sources: config.sources },
    muscles: [
      { m: 'biceps', side: 'both', e: (t) => Math.max(stage(t, 'near').curl, stage(t, 'far').curl) },
      { m: 'delts', side: 'both', scale: 0.65, e: (t) => Math.max(stage(t, 'near').press, stage(t, 'far').press) },
      { m: 'triceps', side: 'both', scale: 0.45, e: (t) => Math.max(stage(t, 'near').press, stage(t, 'far').press) },
      { m: 'forearms', side: 'both', scale: 0.35 },
    ],
    dynamic: [dumbbell('f', 'profile'), dumbbell('n', 'profile')],
    pose(t): Pose {
      const near = stage(t, 'near');
      const far = stage(t, 'far');
      return { ...standBase, arms: { near: arm(near.curl, near.press), far: arm(far.curl, far.press) } };
    },
  };
}
