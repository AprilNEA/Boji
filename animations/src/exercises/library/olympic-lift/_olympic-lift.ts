// Private Olympic-lift builders. The side-view bar follows the hands, while planted feet and the rail keep the load path honest.
// Clean and snatch builders show the pull, the turnover or punch, and the specific receiving position before a controlled return.
import type { EquipmentTag, SideExercise } from '@/exercise.ts';
import { add, clamp, lerp, timeline, type Timeline, type Vec2 } from '@/math.ts';
import type { Joints, LimbSpec, Pose } from '@/rig.ts';
import { ARM_STRAIGHT, G, GRIP_IN_HAND, hipForShoulder, standLegs, toesDown } from '@/exercises/common.ts';
import { barbell, dumbbell, gripAt, PLATE, plyoBox, smithRails } from '@/exercises/equipment/index.ts';

export interface LiftInfo {
  id: string;
  name: string;
  en: string;
  sources: string[];
}

type Start = 'floor' | 'below-knee' | 'hang' | 'block' | 'smith';
type Catch = 'full' | 'power' | 'split' | 'stand';
type JerkCatch = 'power' | 'split' | 'squat';

const X = 266;
const BX = X + 14;
const H_FLOOR = PLATE.full / 2;
const H_HIP = 168;
const cleanTL = timeline([
  { d: 0.95, from: 0, to: 0.20, e: [0.35, 0.75] },
  { d: 0.25, from: 0.20, to: 0.42, e: [0.75, 1] },
  { d: 0.30, from: 0.42, to: 0.66, e: [1, 0.92] },
  { d: 0.55, from: 0.66, to: 0.82, e: [0.92, 0.72] },
  { d: 1.35, from: 0.82, to: 0, e: [0.72, 0.3] },
]);
const snatchTL = timeline([
  { d: 0.95, from: 0, to: 0.20, e: [0.35, 0.75] },
  { d: 0.25, from: 0.20, to: 0.42, e: [0.75, 1] },
  { d: 0.32, from: 0.42, to: 0.68, e: [1, 0.95] },
  { d: 0.55, from: 0.68, to: 0.84, e: [0.95, 0.75] },
  { d: 1.40, from: 0.84, to: 0, e: [0.75, 0.3] },
]);
const jerkTL = timeline([
  { d: 0.24, from: 0, to: 0.15, e: [0.45, 0.72] },
  { d: 0.38, from: 0.15, to: 0.55, e: [0.75, 1] },
  { d: 0.56, from: 0.55, to: 0.74, e: [1, 0.75] },
  { d: 1.42, from: 0.74, to: 0, e: [0.75, 0.35] },
]);
const balanceTL = timeline([
  { d: 0.22, from: 0, to: 0.14, e: [0.42, 0.7] },
  { d: 0.36, from: 0.14, to: 0.60, e: [0.78, 1] },
  { d: 0.58, from: 0.60, to: 0.78, e: [1, 0.75] },
  { d: 1.44, from: 0.78, to: 0, e: [0.75, 0.35] },
]);

const sourceMeta = (o: LiftInfo, equipment: readonly EquipmentTag[]) =>
  ({ en: o.en, family: 'olympic-lift', equipment: [...equipment], sources: o.sources });

function startHeight(start: Start): number {
  switch (start) {
    case 'floor': return H_FLOOR;
    case 'below-knee': return 105;
    case 'hang': return 145;
    case 'block': return 120;
    case 'smith': return 100;
  }
}

/** Conventional first pull: a straight arm fixes the bar immediately in front of the shins or thighs. */
function pullPose(h: number): Pose {
  const u = clamp((h - H_FLOOR) / (H_HIP - H_FLOOR), 0, 1);
  const th = lerp(-26, -91, u);
  const d = lerp(10, -15, u);
  const grip: Vec2 = [BX, G - h];
  const wrist: Vec2 = [BX, grip[1] - GRIP_IN_HAND];
  const dy = Math.sqrt(ARM_STRAIGHT * ARM_STRAIGHT - d * d);
  const S: Vec2 = [BX + d, wrist[1] - dy];
  const spine = { lumbar: th + 1, thoracic: th - 1 };
  return {
    hip: hipForShoulder(S, spine), spine, neck: th + 3, head: th + 1, farHip: 0,
    legs: standLegs(X, 0),
    arms: {
      near: { target: wrist, side: [-1, 0], hand: 90 },
      far: { target: (J) => add(wrist, [J.Sf[0] - J.S[0], J.Sf[1] - J.S[1]]), side: [-1, 0], hand: 90 },
    },
  };
}

/** Plantar-flexed feet retain toe contact during the violent second-pull extension. */
function toeLegs(lift: number, nearX = X, farX = X): Pose['legs'] {
  const foot = toesDown(lift);
  return {
    near: { target: [nearX, G - 13 - lift], foot, side: [1, 0] },
    far: { target: [farX, G - 13 - lift], foot, side: [1, 0] },
  };
}

function tallBody(lift = 0): Omit<Pose, 'arms'> {
  return {
    hip: [X - 8, G - 13 - 180 - lift], spine: { lumbar: -91, thoracic: -92 }, neck: -89, head: -89,
    farHip: 0, legs: lift > 0 ? toeLegs(lift) : standLegs(X, 0),
  };
}

function squatBody(depth: number, split = false, lift = 0): Omit<Pose, 'arms'> {
  const d = clamp(depth, 0, 1);
  const foot = lift > 0 ? toesDown(lift) : 0;
  const hip: Vec2 = [lerp(X - 8, X - 58, d), lerp(G - 13 - 180, G - 13 - 100, d)];
  const legs = split
    ? {
      near: { target: [X + 36 * d, G - 13 - lift] as Vec2, foot, side: [1, 0] as Vec2 },
      far: { target: [X - 44 * d, G - 13 - lift] as Vec2, foot, side: [1, 0] as Vec2 },
    }
    : lift > 0 ? toeLegs(lift) : standLegs(X, 0);
  return {
    hip: [hip[0], hip[1] - lift], spine: { lumbar: lerp(-91, -63, d), thoracic: lerp(-92, -66, d) },
    neck: lerp(-89, -72, d), head: lerp(-89, -79, d), farHip: 0, legs,
  };
}

const shoulder = (J: Joints, side: 'near' | 'far'): Vec2 => side === 'near' ? J.S : J.Sf;
const highPullArm = (r: number, side: 'near' | 'far'): LimbSpec => ({
  target: (J) => add(shoulder(J, side), [lerp(15, 60, r), lerp(124, -25, r)]),
  side: [1, 0], hand: lerp(90, 0, r),
});
const rackArm = (side: 'near' | 'far'): LimbSpec => ({
  target: (J) => add(shoulder(J, side), [65, -28]), side: [1, 0], hand: 0,
});
const overheadArm = (side: 'near' | 'far'): LimbSpec => ({
  target: (J) => add(shoulder(J, side), [20, -124]), side: [1, 0], hand: 90,
});
const backRackArm = (side: 'near' | 'far'): LimbSpec => ({
  target: (J) => add(shoulder(J, side), [-16, -7]), side: [-1, 0], hand: 180,
});
const rackArms = (): Pose['arms'] => ({ near: rackArm('near'), far: rackArm('far') });
const overheadArms = (): Pose['arms'] => ({ near: overheadArm('near'), far: overheadArm('far') });
const highPullArms = (r: number): Pose['arms'] => ({ near: highPullArm(r, 'near'), far: highPullArm(r, 'far') });
const turnoverRackArm = (r: number, side: 'near' | 'far'): LimbSpec => ({
  target: (J) => add(shoulder(J, side), [lerp(60, 65, r), lerp(-25, -28, r)]), side: [1, 0], hand: 0,
});
const turnoverRackArms = (r: number): Pose['arms'] => ({ near: turnoverRackArm(r, 'near'), far: turnoverRackArm(r, 'far') });
const turnoverOverheadArm = (r: number, side: 'near' | 'far'): LimbSpec => ({
  target: (J) => add(shoulder(J, side), [lerp(60, 20, r), lerp(-25, -124, r)]), side: [1, 0], hand: lerp(0, 90, r),
});
const turnoverOverheadArms = (r: number): Pose['arms'] => ({ near: turnoverOverheadArm(r, 'near'), far: turnoverOverheadArm(r, 'far') });

function propsFor(start: Start) {
  if (start === 'block') {
    const box = plyoBox({ x: BX, h: startHeight(start) - PLATE.full / 2, w: 125 });
    return { props: (pal: Parameters<typeof box.draw>[0]) => ({ back: box.draw(pal) }), propsBox: box.box as [number, number], equipment: ['barbell', 'box'] as const };
  }
  if (start === 'smith') {
    const rails = smithRails({ view: 'side', x: BX });
    return { props: (pal: Parameters<typeof rails.draw>[0]) => ({ back: rails.draw(pal) }), propsBox: rails.box as [number, number], equipment: ['smith'] as const };
  }
  return { equipment: ['barbell'] as const };
}

function cleanPose(q: number, start: Start, catchType: Catch): Pose {
  if (q <= 0.20) return pullPose(lerp(startHeight(start), H_HIP, q / 0.20));
  // The heels rise before the elbows bend. The early catch lowers the heels continuously.
  if (q <= 0.30) return { ...tallBody(18 * (q - 0.20) / 0.10), arms: highPullArms(0) };
  if (q <= 0.42) return { ...tallBody(18), arms: highPullArms((q - 0.30) / 0.12) };
  const depth = catchType === 'full' ? 1 : catchType === 'power' ? 0.44 : catchType === 'split' ? 0.58 : 0;
  if (q <= 0.66) {
    const r = (q - 0.42) / 0.24;
    return { ...squatBody(depth * r, catchType === 'split', 18 * (1 - r)), arms: turnoverRackArms(r) };
  }
  return { ...squatBody(depth * (1 - (q - 0.66) / 0.16), catchType === 'split'), arms: rackArms() };
}

/** Pull from the selected start, turn over around the shoulders, and stand with the bar in a front rack. */
export function clean(o: LiftInfo, start: Start = 'floor', catchType: Catch = 'full'): SideExercise {
  const extra = propsFor(start);
  return {
    ...o, tl: cleanTL, meta: sourceMeta(o, extra.equipment),
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.65 }, { m: 'traps', scale: 0.45 }, { m: 'forearms', side: 'both', scale: 0.35 }],
    ...(extra.props ? { props: extra.props, propsBox: extra.propsBox } : {}),
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.49,
    pose: (t) => cleanPose(cleanTL.at(t).p, start, catchType),
  };
}

function snatchPose(q: number, start: Start, catchType: Catch): Pose {
  if (q <= 0.20) return pullPose(lerp(startHeight(start), H_HIP, q / 0.20));
  // A snatch has the same violent leg extension, then a longer turnover to lockout.
  if (q <= 0.30) return { ...tallBody(18 * (q - 0.20) / 0.10), arms: highPullArms(0) };
  if (q <= 0.42) return { ...tallBody(18), arms: highPullArms((q - 0.30) / 0.12) };
  const depth = catchType === 'full' ? 1 : catchType === 'power' ? 0.44 : catchType === 'split' ? 0.58 : 0;
  if (q <= 0.68) {
    const r = (q - 0.42) / 0.26;
    return { ...squatBody(depth * r, catchType === 'split', 18 * (1 - r)), arms: turnoverOverheadArms(r) };
  }
  return { ...squatBody(depth * (1 - (q - 0.68) / 0.16), catchType === 'split'), arms: overheadArms() };
}

/** Snatch pull and turnover. The locked bar remains above the shoulder line while the catch recovers. */
export function snatch(o: LiftInfo, start: Start = 'floor', catchType: Catch = 'full'): SideExercise {
  const extra = propsFor(start);
  return {
    ...o, tl: snatchTL, meta: sourceMeta(o, extra.equipment),
    muscles: [{ m: 'quads', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.8 }, { m: 'glutes', scale: 0.75 }, { m: 'delts', side: 'both', scale: 0.6 }, { m: 'triceps', side: 'both', scale: 0.45 }, { m: 'traps', scale: 0.35 }],
    ...(extra.props ? { props: extra.props, propsBox: extra.propsBox } : {}),
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.44,
    pose: (t) => snatchPose(snatchTL.at(t).p, start, catchType),
  };
}

/** A clean or snatch pull stops at violent triple extension; the arms remain straight and the bar stays close. */
export function pull(o: LiftInfo, start: Start, snatchGrip = false): SideExercise {
  const tl = timeline([
    { d: 1.05, from: 0, to: 1, e: [0.35, 1] },
    { d: 0.18, from: 1, to: 1, e: [1, 0.88] },
    { d: 1.55, from: 1, to: 0, e: [0.82, 0.32] },
  ]);
  return {
    ...o, tl, meta: sourceMeta(o, ['barbell']),
    muscles: [{ m: 'quads', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.8 }, { m: 'glutes', scale: 0.75 }, { m: 'traps', scale: 0.55 }, { m: 'lowerBack', scale: 0.45 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.37,
    pose: (t) => {
      const p = tl.at(t).p;
      // Side view is end-on. The snatch variant retains straight arms and the same close bar path.
      void snatchGrip;
      if (p < 0.82) return pullPose(lerp(startHeight(start), H_HIP, p / 0.82));
      return { ...tallBody(18 * (p - 0.82) / 0.18), arms: highPullArms(0) };
    },
  };
}

/** Drive from the shallow jerk dip into full extension, while the toes stay in contact with the platform. */
function jerkDriveBody(r: number, startSplit: boolean): Omit<Pose, 'arms'> {
  const baseDepth = startSplit ? 0.18 : 0;
  const lift = 18 * r;
  const body = startSplit ? squatBody(baseDepth, true, lift) : tallBody(lift);
  const standingY = G - 13 - 180 + 80 * baseDepth;
  return { ...body, hip: [body.hip[0], standingY + 13 * (1 - r) - 18 * r] };
}

function jerkPose(q: number, catchType: JerkCatch, startSplit = false): Pose {
  const baseDepth = startSplit ? 0.18 : 0;
  const splitFeet = catchType === 'split' || startSplit;
  if (q <= 0.15) {
    const dip = q / 0.15;
    const base = startSplit ? squatBody(baseDepth, true) : tallBody();
    return { ...base, hip: [base.hip[0], base.hip[1] + 13 * dip], arms: rackArms() };
  }
  const depth = catchType === 'squat' ? 1 : catchType === 'power' ? 0.44 : 0.58;
  if (q <= 0.34) {
    const r = (q - 0.15) / 0.19;
    return { ...jerkDriveBody(r, startSplit), arms: turnoverOverheadArms(r) };
  }
  if (q <= 0.55) {
    const r = (q - 0.34) / 0.21;
    return { ...squatBody(lerp(baseDepth, depth, r), splitFeet, 18 * (1 - r)), arms: overheadArms() };
  }
  return { ...squatBody(lerp(depth, baseDepth, (q - 0.55) / 0.19), splitFeet), arms: overheadArms() };
}

/** Shallow vertical dip, then a locked-out receiving position with the requested footwork. */
export function jerk(o: LiftInfo, catchType: JerkCatch, startSplit = false): SideExercise {
  return {
    ...o, tl: jerkTL, meta: sourceMeta(o, ['barbell']),
    muscles: [{ m: 'quads', side: 'both' }, { m: 'delts', side: 'both', scale: 0.8 }, { m: 'triceps', side: 'both', scale: 0.6 }, { m: 'glutes', scale: 0.55 }, { m: 'calves', side: 'both', scale: 0.35 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.25,
    pose: (t) => jerkPose(jerkTL.at(t).p, catchType, startSplit),
  };
}

/** Jerk dip squat: knees travel forward under an upright torso while the bar stays on the front rack. */
export function jerkDip(o: LiftInfo): SideExercise {
  const tl = timeline([
    { d: 0.65, from: 0, to: 1, e: [0.35, 0.8] },
    { d: 0.20, from: 1, to: 1, e: [0.8, 0.8] },
    { d: 1.10, from: 1, to: 0, e: [0.75, 0.3] },
    { d: 0.35, from: 0, to: 0, e: [0.3, 0.3] },
  ]);
  return {
    ...o, tl, meta: sourceMeta(o, ['barbell']),
    muscles: [{ m: 'quads', side: 'both' }, { m: 'abs', scale: 0.45 }, { m: 'calves', side: 'both', scale: 0.3 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.25,
    pose: (t) => {
      const p = tl.at(t).p;
      return { ...tallBody(), hip: [X - 8, G - 13 - 180 + 16 * p], arms: rackArms() };
    },
  };
}

/** The snatch-balance starts with the bar on the upper back, then punches under it into an overhead squat. */
export function snatchBalance(o: LiftInfo, heaving = false): SideExercise {
  return {
    ...o, tl: balanceTL, meta: sourceMeta(o, ['barbell']),
    muscles: [{ m: 'quads', side: 'both' }, { m: 'delts', side: 'both', scale: 0.7 }, { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'glutes', scale: 0.55 }, { m: 'hamstrings', side: 'both', scale: 0.4 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.47,
    pose: (t) => {
      const q = balanceTL.at(t).p;
      if (q <= 0.14) {
        const dip = q / 0.14;
        return { ...tallBody(), hip: [X - 8, G - 13 - 180 + (heaving ? 15 : 10) * dip], arms: { near: backRackArm('near'), far: backRackArm('far') } };
      }
      if (q <= 0.60) {
        const r = (q - 0.14) / 0.46;
        const arm = (side: 'near' | 'far'): LimbSpec => ({
          target: (J) => add(shoulder(J, side), [lerp(-16, 20, r), lerp(-7, -124, r)]), side: [1, 0], hand: lerp(180, 90, r),
        });
        return { ...squatBody(r), arms: { near: arm('near'), far: arm('far') } };
      }
      return { ...squatBody(1 - (q - 0.60) / 0.18), arms: overheadArms() };
    },
  };
}

/** Scarecrow-to-rack drill: elbows rotate forward while the bar stays close to the torso. */
export function rackDelivery(o: LiftInfo): SideExercise {
  const tl = timeline([
    { d: 0.8, from: 0, to: 1, e: [0.4, 0.9] },
    { d: 0.25, from: 1, to: 1, e: [0.9, 0.85] },
    { d: 1.25, from: 1, to: 0, e: [0.8, 0.35] },
    { d: 0.3, from: 0, to: 0, e: [0.35, 0.35] },
  ]);
  return {
    ...o, tl, meta: sourceMeta(o, ['barbell']),
    muscles: [{ m: 'delts', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.55 }, { m: 'traps', scale: 0.35 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.34,
    pose: (t) => {
      const p = tl.at(t).p;
      const scare: LimbSpec = { a1: 0, a2: 90, hand: 90 };
      return { ...tallBody(), arms: p < 0.5 ? { near: scare, far: scare } : rackArms() };
    },
  };
}

/** Mid-thigh clean-grip shrug: the bar stays at the thighs as the torso rises a few pixels into the shrug. */
export function cleanShrug(o: LiftInfo): SideExercise {
  const tl = timeline([
    { d: 0.7, from: 0, to: 1, e: [0.4, 1] },
    { d: 0.3, from: 1, to: 1, e: [1, 0.85] },
    { d: 1.25, from: 1, to: 0, e: [0.8, 0.35] },
    { d: 0.3, from: 0, to: 0, e: [0.35, 0.3] },
  ]);
  return {
    ...o, tl, meta: sourceMeta(o, ['barbell']), muscles: [{ m: 'traps' }, { m: 'forearms', side: 'both', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.3 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.27,
    pose: (t) => pullPose(lerp(145, 155, tl.at(t).p)),
  };
}

/** Clean plus a strict overhead press after the athlete has stood with the load racked. */
export function cleanAndPress(o: LiftInfo): SideExercise {
  const tl = timeline([
    { d: 0.85, from: 0, to: 0.20, e: [0.35, 0.75] },
    { d: 0.22, from: 0.20, to: 0.42, e: [0.75, 1] },
    { d: 0.30, from: 0.42, to: 0.66, e: [1, 0.9] },
    { d: 0.45, from: 0.66, to: 0.82, e: [0.9, 0.72] },
    { d: 0.72, from: 0.82, to: 1, e: [0.72, 1] },
    { d: 1.45, from: 1, to: 0, e: [0.9, 0.32] },
  ]);
  return {
    ...o, tl, meta: sourceMeta(o, ['barbell']),
    muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.65 }, { m: 'quads', side: 'both', scale: 0.65 }, { m: 'glutes', scale: 0.5 }, { m: 'traps', scale: 0.35 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.64,
    pose: (t) => {
      const q = tl.at(t).p;
      if (q <= 0.82) return cleanPose(q, 'floor', 'full');
      const r = (q - 0.82) / 0.18;
      return { ...tallBody(), arms: turnoverOverheadArms(r) };
    },
  };
}

/** Full clean followed by a split jerk; the second phase begins only after the front-rack recovery. */
export function cleanAndJerk(o: LiftInfo): SideExercise {
  const tl = timeline([
    { d: 0.85, from: 0, to: 0.20, e: [0.35, 0.75] },
    { d: 0.22, from: 0.20, to: 0.42, e: [0.75, 1] },
    { d: 0.30, from: 0.42, to: 0.66, e: [1, 0.9] },
    { d: 0.42, from: 0.66, to: 0.82, e: [0.9, 0.72] },
    { d: 0.20, from: 0.82, to: 0.88, e: [0.72, 0.8] },
    { d: 0.43, from: 0.88, to: 1, e: [0.8, 1] },
    { d: 1.55, from: 1, to: 0, e: [0.9, 0.32] },
  ]);
  return {
    ...o, tl, meta: sourceMeta(o, ['barbell']),
    muscles: [{ m: 'quads', side: 'both' }, { m: 'delts', side: 'both', scale: 0.85 }, { m: 'triceps', side: 'both', scale: 0.65 }, { m: 'glutes', scale: 0.65 }, { m: 'hamstrings', side: 'both', scale: 0.5 }, { m: 'traps', scale: 0.35 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.62,
    pose: (t) => {
      const q = tl.at(t).p;
      if (q <= 0.82) return cleanPose(q, 'floor', 'full');
      const r = (q - 0.82) / 0.18;
      if (r < 0.25) return { ...tallBody(), hip: [X - 8, G - 13 - 180 + 13 * (r / 0.25)], arms: rackArms() };
      const drive = (r - 0.25) / 0.28;
      if (drive < 1) return { ...jerkDriveBody(drive, false), arms: turnoverOverheadArms(drive) };
      const catchR = clamp((drive - 1) / 0.72, 0, 1);
      return { ...squatBody(0.58 * catchR, true, 18 * (1 - catchR)), arms: overheadArms() };
    },
  };
}

/** One-arm snatch alternates the visible near and far arms so both sides appear in the loop. */
export function singleArmSnatch(o: LiftInfo, dumbbells = false): SideExercise {
  const tl: Timeline = { total: 3.6, at: (t) => ({ p: t, e: 0.8, seg: { d: 3.6, from: 0, to: 1 }, u: t }) };
  const armFor = (p: number, side: 'near' | 'far'): LimbSpec => ({
    target: (J) => add(shoulder(J, side), [lerp(15, 20, p), lerp(120, -124, p)]), side: [1, 0], hand: lerp(90, 90, p),
  });
  return {
    ...o, tl, meta: sourceMeta(o, [dumbbells ? 'dumbbell' : 'barbell']),
    muscles: [{ m: 'delts', side: 'both' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.6 }, { m: 'quads', side: 'both', scale: 0.55 }, { m: 'triceps', side: 'both', scale: 0.4 }],
    dynamic: dumbbells
      ? [dumbbell('n', 'end')]
      : [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    poster: 0.25,
    pose: (t) => {
      const cycle = (t * 2) % 1;
      const p = Math.sin(Math.PI * cycle);
      const near = t < 0.5;
      // Each half-cycle starts from a shallow hinge, reaches a toe-off, then receives overhead with soft knees.
      const up = Math.min(p / 0.60, 1);
      const receive = p <= 0.60 ? 0 : (p - 0.60) / 0.40;
      const body = squatBody(p <= 0.60 ? 0.38 * (1 - up) : 0.22 * receive, false, 18 * (1 - receive) * up);
      return {
        ...body,
        arms: near
          ? { near: armFor(p, 'near'), far: { a1: 100, a2: 95, hand: 90 } }
          : { near: { a1: 100, a2: 95, hand: 90 }, far: armFor(p, 'far') },
      };
    },
  };
}

/** Both dumbbells leave the floor and turn over to each shoulder in a balanced squat catch. */
export function dumbbellClean(o: LiftInfo): SideExercise {
  return {
    ...o, tl: cleanTL, meta: sourceMeta(o, ['dumbbell']),
    muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.75 }, { m: 'quads', side: 'both', scale: 0.7 }, { m: 'traps', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.4 }],
    dynamic: [dumbbell('f', 'profile'), dumbbell('n', 'profile')], poster: 0.49,
    pose: (t) => cleanPose(cleanTL.at(t).p, 'floor', 'full'),
  };
}

/** Short skier pull: a soft hinge turns into a small toe-off while the bar rises toward the shoulders. */
export function skier(o: LiftInfo): SideExercise {
  const tl = timeline([
    { d: 0.40, from: 0, to: 1, e: [0.45, 1] },
    { d: 0.12, from: 1, to: 1, e: [1, 0.85] },
    { d: 0.72, from: 1, to: 0, e: [0.82, 0.35] },
  ]);
  return {
    ...o, tl, meta: sourceMeta(o, ['barbell']),
    muscles: [{ m: 'delts', side: 'both' }, { m: 'quads', side: 'both', scale: 0.55 }, { m: 'glutes', scale: 0.5 }, { m: 'triceps', side: 'both', scale: 0.3 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })], poster: 0.25,
    pose: (t) => {
      const p = tl.at(t).p;
      return p < 0.45
        ? pullPose(lerp(145, H_HIP, p / 0.45))
        : (() => {
          const r = (p - 0.45) / 0.55;
          const lift = 8 * r;
          return { ...tallBody(lift), arms: highPullArms(r) };
        })();
    },
  };
}
