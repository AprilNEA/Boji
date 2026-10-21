// Private builders for the front-raise family. Standing, seated, bench and kneeling bases keep their feet, knees or support pads fixed.
// Arm targets move through a controlled shoulder-flexion arc with a soft elbow. Equipment follows each hand or shared grip.
import type { FrontExercise, LibraryMeta, SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, sub, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline, type Timeline } from '@/math/timeline.ts';
import { add3, type Vec3 } from '@/math/vec3.ts';
import { BODY, type Joints, type LimbPair, type LimbSpec, type Pose } from '@/rig/side.ts';
import type { FrontJoints } from '@/rig/front.ts';
import { A, G, handOnHip, standLegs } from '@/exercises/common.ts';
import {
  BALL, bandLine, barbell, cableColumn, cableHandle, cableLine, dumbbell, flatBench, frontDumbbell,
  gripAt, heldPlate, inclineBench, stabilityBall, towardCable, workTL,
} from '@/exercises/equipment/index.ts';

type Implement = 'dumbbell' | 'barbell' | 'band' | 'cable' | 'plate' | 'two-hand-dumbbell';

interface StandingConfig {
  id: string;
  name: string;
  en: string;
  sources: string[];
  implement: Implement;
  top?: number;
  alternate?: boolean;
  unilateral?: boolean;
  equipment?: LibraryMeta['equipment'];
}

interface SeatedConfig {
  id: string;
  name: string;
  en: string;
  sources: string[];
  ball?: boolean;
  alternate?: boolean;
}

const REACH = 124;
// Leave only 0.1 px of leg slack: this is a tall, fully planted standing position, not a soft-knee squat.
const STAND_HIP: Vec2 = [238, G - A - BODY.thigh - BODY.shin + 0.1];
const STAND_LEGS = standLegs(STAND_HIP[0], 0);
const SEAT_BENCH = flatBench({ view: 'side', x: 220, top: 94, length: 230 });
const INCLINE = inclineBench({ x: 286, angle: 50, facing: 1 });
const PRONE_INCLINE = inclineBench({ x: 242, angle: 45, facing: -1 });
const SUPINE_BENCH = flatBench({ view: 'side', x: 246, top: 96, length: 250 });

export const normalTL = workTL(0.35);
export const alternatingTL = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.35, 1] }, { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.25, from: 0, to: 0, e: [0.3, 0.3] },
  { d: 1.0, from: 0, to: 1, e: [0.35, 1] }, { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.25, from: 0, to: 0, e: [0.3, 0.3] },
]);

/** One complete controlled raise for each arm. The second arm starts only after the first returns to the thigh. */
export function alternatingProgress(t: number): [number, number] {
  const x = t * alternatingTL.total;
  const rep = (u: number): number => {
    if (u <= 1) return smooth(u);
    if (u <= 1.35) return 1;
    if (u <= 2.95) return 1 - smooth((u - 1.35) / 1.6);
    return 0;
  };
  return x < 3.2 ? [rep(x), 0] : [0, rep(x - 3.2)];
}

function standingBase(): Omit<Pose, 'arms'> {
  return {
    hip: STAND_HIP, spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: STAND_LEGS,
  };
}

function seatedBase(ball = false): Omit<Pose, 'arms'> {
  const hip: Vec2 = ball ? [232, G - 143] : [220, G - 106];
  const footX = ball ? 314 : 317;
  const legs: LimbPair = {
    near: { target: [footX, G - A], foot: 0, side: [0, -1] },
    far: { target: [footX - 6, G - A], foot: 0, side: [0, -1] },
  };
  return { hip, spine: { lumbar: -90, thoracic: -91 }, neck: -90, head: -90, legs };
}

/** Wrist target for a front raise. 84° is down and a little in front of the thigh; 0° is shoulder height. */
function raiseArm(p: number, top: number, far = false): LimbSpec {
  return {
    target: (J: Joints) => add(far ? J.Sf : J.S, mul(dir(lerp(84, top, p)), REACH)),
    side: [1, 1], hand: 90,
  };
}

function raisePose(base: Omit<Pose, 'arms'>, near: number, far: number, top: number, unilateral: boolean): Pose {
  return {
    ...base,
    arms: {
      near: raiseArm(near, top),
      far: unilateral ? handOnHip(-2) : raiseArm(far, top, true),
    },
  };
}

function dynamics(implement: Implement, unilateral: boolean) {
  if (implement === 'dumbbell') {
    return unilateral ? [dumbbell('n', 'end')] : [dumbbell('f', 'end'), dumbbell('n', 'end')];
  }
  if (implement === 'barbell') return [barbell({ view: 'side', plate: 'medium', at: (J: Joints) => ({ p: gripAt(J, 'n') }) })];
  if (implement === 'plate') return [heldPlate((J: Joints) => ({ p: gripAt(J, 'n') }), 'face', 'medium')];
  if (implement === 'two-hand-dumbbell') return [dumbbell('n', 'profile')];
  return [];
}

/** Standing front raise variants. Cables sit behind the lifter so the low pulley resists forward shoulder flexion. */
export function standingFrontRaise(c: StandingConfig): SideExercise {
  const tl = c.alternate ? alternatingTL : normalTL;
  const top = c.top ?? 0;
  const unilateral = c.unilateral ?? false;
  const column = cableColumn({ x: 128, pulleyY: G - 55, toward: 1, top: 58 });
  const equipment = c.equipment ?? (c.implement === 'plate' ? ['other', 'plate']
    : c.implement === 'two-hand-dumbbell' ? ['dumbbell'] : [c.implement]);
  const cable = c.implement === 'cable';
  return {
    id: c.id, name: c.name, tl,
    meta: { en: c.en, family: 'front-raise', equipment, sources: c.sources },
    muscles: [
      { m: 'delts', side: unilateral ? 'near' : 'both' },
      { m: 'triceps', side: unilateral ? 'near' : 'both', scale: 0.35 },
      { m: 'traps', scale: 0.3 },
    ],
    props: cable ? (pal) => ({ back: column.draw(pal) }) : undefined,
    propsBox: cable ? [column.box[0], STAND_HIP[0] + 72] : undefined,
    dynamic: cable ? [
      cableLine(column.pulley, (J: Joints) => gripAt(J, 'n'), 'Low cable'),
      cableHandle('d', (J: Joints) => {
        const p = gripAt(J, 'n');
        return { p, a: towardCable(p, column.pulley) };
      }),
    ] : c.implement === 'band' ? [
      bandLine((J: Joints) => [[J.ankle_n[0] + 8, G - 5], gripAt(J, 'n')], 'underNearArm', 'Near resistance band'),
      ...(unilateral ? [] : [bandLine((J: Joints) => [[J.ankle_f[0] + 8, G - 5], gripAt(J, 'f')], 'overFarArm', 'Far resistance band')]),
    ] : dynamics(c.implement, unilateral),
    pose: (t) => {
      const [near, far] = c.alternate ? alternatingProgress(t) : [tl.at(t).p, tl.at(t).p];
      return raisePose(standingBase(), near, far, top, unilateral);
    },
  };
}

/** Bilateral or alternating seated dumbbell front raises. Both feet stay flat; the ball variant keeps its center on the floor. */
export function seatedFrontRaise(c: SeatedConfig): SideExercise {
  const tl = c.alternate ? alternatingTL : normalTL;
  const ballCenter: Vec2 = [232, G - BALL.r];
  return {
    id: c.id, name: c.name, tl,
    meta: {
      en: c.en, family: 'front-raise', equipment: c.ball ? ['dumbbell', 'stability-ball'] : ['dumbbell', 'bench'], sources: c.sources,
    },
    muscles: [
      { m: 'delts', side: c.alternate ? 'near' : 'both' },
      { m: 'traps', scale: 0.3 }, { m: 'biceps', side: c.alternate ? 'near' : 'both', scale: 0.3 },
    ],
    props: c.ball ? undefined : (pal) => ({ back: SEAT_BENCH.draw(pal) }),
    propsBox: c.ball ? [ballCenter[0] - BALL.r, ballCenter[0] + BALL.r] : SEAT_BENCH.box,
    dynamic: [
      ...(c.ball ? [stabilityBall(() => ({ p: ballCenter }), 'back')] : []),
      dumbbell('f', 'end'), dumbbell('n', 'end'),
    ],
    pose: (t) => {
      const [near, far] = c.alternate ? alternatingProgress(t) : [tl.at(t).p, tl.at(t).p];
      return raisePose(seatedBase(c.ball), near, far, 0, false);
    },
  };
}

/** Supported incline front raise: the back and head stay on a 50° pad while straight arms travel toward the vertical. */
export function inclineDumbbellFrontRaise(c: { id: string; name: string; en: string; sources: string[] }): SideExercise {
  const base: Omit<Pose, 'arms'> = {
    hip: [275, G - 109], spine: { lumbar: -124, thoracic: -126 }, neck: -124, head: -124,
    legs: {
      near: { target: [373, G - A], foot: 0, side: [0, -1] },
      far: { target: [367, G - A], foot: 0, side: [0, -1] },
    },
  };
  return {
    id: c.id, name: c.name, tl: normalTL,
    meta: { en: c.en, family: 'front-raise', equipment: ['dumbbell', 'bench'], sources: c.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: INCLINE.draw(pal) }), propsBox: INCLINE.box,
    dynamic: [dumbbell('f', 'end'), dumbbell('n', 'end')],
    pose: (t) => {
      const p = normalTL.at(t).p;
      return {
        ...base,
        arms: {
          near: raiseArm(p, -35),
          far: raiseArm(p, -35, true),
        },
      };
    },
  };
}

/** Prone incline raise: the chest stays on the pad while both straight arms move from a vertical hang to in front of the head. */
export function proneInclineBarbellRaise(c: { id: string; name: string; en: string; sources: string[] }): SideExercise {
  const base: Omit<Pose, 'arms'> = {
    hip: [244, G - 111], spine: { lumbar: -46, thoracic: -45 }, neck: -44, head: -43,
    legs: { near: { a1: 35, a2: 16, foot: 0 }, far: { a1: 35, a2: 16, foot: 0 } },
  };
  return {
    id: c.id, name: c.name, tl: normalTL,
    meta: { en: c.en, family: 'front-raise', equipment: ['barbell', 'bench'], sources: c.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'traps', scale: 0.4 }],
    props: (pal) => ({ back: PRONE_INCLINE.draw(pal) }), propsBox: PRONE_INCLINE.box,
    dynamic: [barbell({ view: 'side', plate: 'small', at: (J: Joints) => ({ p: gripAt(J, 'n') }) })],
    pose: (t) => {
      const p = normalTL.at(t).p;
      const arm = (far: boolean): LimbSpec => ({
        target: (J: Joints) => add(far ? J.Sf : J.S, mul(dir(lerp(90, -45, p)), REACH)),
        side: [1, 1], hand: 90,
      });
      return { ...base, arms: { near: arm(false), far: arm(true) } };
    },
  };
}

/** Supine barbell pullover: the torso stays on the flat bench while straight arms carry the bar from thighs, over the chest, to behind the head. */
export function supineBarbellPullover(c: { id: string; name: string; en: string; sources: string[] }): SideExercise {
  const base: Omit<Pose, 'arms'> = {
    hip: [222, G - 114], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
    legs: { near: { a1: 0, a2: 0, foot: 0 }, far: { a1: 0, a2: 0, foot: 0 } },
  };
  return {
    id: c.id, name: c.name, tl: normalTL,
    meta: { en: c.en, family: 'front-raise', equipment: ['barbell', 'bench'], sources: c.sources },
    muscles: [{ m: 'pecs' }, { m: 'lats', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.45 }, { m: 'triceps', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: SUPINE_BENCH.draw(pal) }), propsBox: SUPINE_BENCH.box,
    dynamic: [barbell({ view: 'side', plate: 'small', at: (J: Joints) => ({ p: gripAt(J, 'n') }) })],
    pose: (t) => {
      const p = normalTL.at(t).p;
      const arm = (far: boolean): LimbSpec => ({
        target: (J: Joints) => add(far ? J.Sf : J.S, mul(dir(lerp(0, -180, p)), REACH)),
        side: [0, -1], hand: 90,
      });
      return { ...base, arms: { near: arm(false), far: arm(true) } };
    },
  };
}

/** Tall kneeling overhead front raise. Knees and shins remain down while the torso stays neutral. */
export function kneelingDumbbellOverheadRaise(c: { id: string; name: string; en: string; sources: string[] }): SideExercise {
  const base: Omit<Pose, 'arms'> = {
    hip: [230, 341], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: {
      near: { a1: 90, a2: 180, foot: 180 },
      far: { a1: 90, a2: 180, foot: 180 },
    },
  };
  return {
    id: c.id, name: c.name, tl: normalTL, mat: true,
    meta: { en: c.en, family: 'front-raise', equipment: ['dumbbell', 'mat'], sources: c.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.4 }, { m: 'abs', scale: 0.3 }],
    dynamic: [dumbbell('f', 'end'), dumbbell('n', 'end')],
    pose: (t) => {
      const p = normalTL.at(t).p;
      return raisePose(base, p, p, -90, false);
    },
  };
}

const MIXED_TL = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.35, 1] }, { d: 0.3, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.4, from: 0, to: 0, e: [0.3, 0.3] },
  { d: 1.0, from: 0, to: 1, e: [0.35, 1] }, { d: 0.3, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.6, from: 1, to: 0, e: [0.85, 0.35] }, { d: 0.4, from: 0, to: 0, e: [0.3, 0.3] },
]);

function mixedProgress(t: number): { front: number; lateral: number } {
  const x = t * MIXED_TL.total;
  const rep = (u: number): number => {
    if (u <= 1) return smooth(u);
    if (u <= 1.3) return 1;
    if (u <= 2.9) return 1 - smooth((u - 1.3) / 1.6);
    return 0;
  };
  return x < 3.3 ? { front: rep(x), lateral: 0 } : { front: 0, lateral: rep(x - 3.3) };
}

function frontRaiseTarget(s: 'l' | 'r', front: number, lateral: number, J: FrontJoints): Vec3 {
  const sign = s === 'l' ? 1 : -1;
  if (front > 0) {
    // The arm moves from vertical down toward the viewer. Keep its reach constant, so the elbow stays softly bent.
    const th = front * Math.PI / 2, x = sign * 5 * front;
    const r = Math.sqrt(REACH * REACH - x * x);
    return add3(J[`shoulder_${s}`], [x, -Math.cos(th) * r, Math.sin(th) * r]);
  }
  // Lateral raise: 30 px forward is the scapular plane. The lateral reach is constant as the arm abducts.
  const th = lateral * 86 * Math.PI / 180, z = lerp(14, 30, lateral);
  const r = Math.sqrt(REACH * REACH - z * z);
  return add3(J[`shoulder_${s}`], [sign * Math.sin(th) * r, -Math.cos(th) * r, z]);
}

/** Front-view alternation: both dumbbells complete a front raise, then both complete a lateral raise. */
export function frontAndLateralRaise(c: { id: string; name: string; en: string; sources: string[] }): FrontExercise {
  return {
    id: c.id, name: c.name, view: 'front', tl: MIXED_TL,
    meta: { en: c.en, family: 'front-raise', equipment: ['dumbbell'], sources: c.sources },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'traps', scale: 0.3 }],
    dynamic: [frontDumbbell('l', 'profile'), frontDumbbell('r', 'profile')],
    // The lateral top is the clearest still for a front-facing alternating movement.
    poster: 4.45 / MIXED_TL.total,
    pose: (t) => {
      const { front, lateral } = mixedProgress(t);
      return {
        // Match the upright side-view leg reach while retaining the front-view stance width.
        pelvis: [0, BODY.ankleH + 183.8, 0], hips: { pitch: 2 }, spine: { pitch: -1 }, head: { pitch: -2 },
        legs: { l: { target: [24, BODY.ankleH, 2] }, r: { target: [-24, BODY.ankleH, 2] } },
        arms: {
          l: { target: (J) => frontRaiseTarget('l', front, lateral, J), pole: [0.25, -0.15, -1] },
          r: { target: (J) => frontRaiseTarget('r', front, lateral, J), pole: [-0.25, -0.15, -1] },
        },
      };
    },
  };
}
