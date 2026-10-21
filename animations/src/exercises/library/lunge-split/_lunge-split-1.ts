// Private builders for the lunge-split-1 library files. Side poses keep the front foot flat and the rear heel raised.
// The bottom lunge keeps both knees near 90 degrees, the torso vertical, and the rear knee just above the floor.
import type { FrontExercise, LibraryMeta, MuscleSpec, PropShape, SideExercise } from '@/exercise.ts';
import { add, clamp, lerp, lerpV, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline } from '@/math/timeline.ts';
import { add3, lerp3, type Vec3 } from '@/math/vec3.ts';
import type { Joints, LimbSpec, Pose } from '@/rig/side.ts';
import { BODY } from '@/rig/side.ts';
import { A, G, handOnHip, toesDown } from '@/exercises/common.ts';
import { aerobicStep, bandCurve, bandLine, barbell, flatBench } from '@/exercises/equipment/index.ts';

const X = 272;
const STANDING_HIP: Vec2 = [X - 8, G - A - 183.7];
const repTL = timeline([
  { d: 1.05, from: 0, to: 1, e: [0.2, 1] },
  { d: 0.3, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.55, from: 1, to: 0, e: [0.85, 0.35] },
  { d: 0.45, from: 0, to: 0, e: [0.3, 0.2] },
]);
const walkingTL = timeline([
  { d: 0.85, from: 0, to: 1, e: [0.25, 1] },
  { d: 0.15, from: 1, to: 1, e: [1, 0.9] },
  { d: 0.9, from: 1, to: 0, e: [0.85, 0.35] },
]);

export type SideLungeKind = 'forward' | 'reverse' | 'split' | 'deficit' | 'bulgarian' | 'slide';

interface SideLungeOptions {
  id: string;
  name: string;
  meta: LibraryMeta;
  kind: SideLungeKind;
  alternate?: boolean;
  bar?: boolean;
  band?: 'ankles' | 'thighs';
  overhead?: boolean;
  support?: boolean;
  walking?: boolean;
  highKnee?: boolean;
}

const phase = (t: number, alternate: boolean, tl = repTL) => {
  const part = alternate ? (t < 0.5 ? 0 : 1) : 0;
  const local = alternate ? (t % 0.5) * 2 : t;
  const p = tl.at(local);
  return { side: part === 0 ? 'near' as const : 'far' as const, p: p.p, e: p.e };
};

/** Hands grip the bar just behind the shoulder line. The side-view plate stays on the upper back. */
function backRackArms(): Pose['arms'] {
  return {
    near: {
      target: (J: Joints) => add(J.S, [-31, -18]), side: [-0.2, 1], hand: -145,
    },
    far: {
      target: (J: Joints) => add(J.Sf, [-34, -15]), side: [-0.2, 1], hand: -145,
    },
  };
}

function overheadArms(p: number): Pose['arms'] {
  const a = lerp(91, -87, p);
  return {
    near: { a1: a, a2: a - 2, hand: a - 2 },
    far: { a1: a + 2, a2: a, hand: a },
  };
}

function lungeMuscles(alternate: boolean, e: (t: number) => number, tl = repTL): MuscleSpec[] {
  if (!alternate) return [
    { m: 'quads', side: 'near', e }, { m: 'glutes', e }, { m: 'hamstrings', side: 'near', scale: 0.45, e },
  ];
  return [
    { m: 'quads', side: 'near', e: (t) => (phase(t, true, tl).side === 'near' ? e(t) : 0.22 * e(t)) },
    { m: 'quads', side: 'far', e: (t) => (phase(t, true, tl).side === 'far' ? e(t) : 0.22 * e(t)) },
    { m: 'glutes', e }, { m: 'hamstrings', side: 'both', scale: 0.4, e },
  ];
}

function ordinaryLunge(kind: Exclude<SideLungeKind, 'bulgarian' | 'slide'>, p: number, lead: 'near' | 'far'): Pose {
  const isSplit = kind === 'split';
  const deficit = kind === 'deficit';
  const raised = deficit ? 31 : 0;
  const surface = G - raised;
  const frontBottom = isSplit ? X + 64 : kind === 'forward' ? X + 84 : X;
  const rearBottom = isSplit ? X - 114 : frontBottom - 178;
  const frontTop = isSplit ? frontBottom : X;
  const rearTop = isSplit ? rearBottom : X - 6;
  const rearGround = deficit ? lerp(surface, G, p) : surface;
  const rearHeel = lerp(A, 30, isSplit ? 1 : p);
  const flight = isSplit ? 0 : 12 * Math.sin(Math.PI * clamp(p / 0.68, 0, 1));
  const front: LimbSpec = { target: [lerp(frontTop, frontBottom, p), surface - A], foot: 0, side: [1, 0] };
  const back: LimbSpec = {
    target: [lerp(rearTop, rearBottom, p), rearGround - rearHeel - flight],
    foot: toesDown(rearHeel + flight), side: [1, 0],
  };
  const hipTop: Vec2 = isSplit ? [270, G - A - 161] : [X - 8, surface - A - 183.7];
  const hipBottom: Vec2 = [frontBottom - 84, surface - 118];
  const hip = lerpV(hipTop, hipBottom, p);
  return {
    hip,
    spine: { lumbar: lerp(-89, -83, p), thoracic: lerp(-91, -86, p) },
    neck: lerp(-86, -84, p), head: -88,
    legs: lead === 'near' ? { near: front, far: back } : { near: back, far: front },
    arms: { near: handOnHip(0), far: handOnHip(-4) },
  };
}

function bulgarianPose(p: number, bar: boolean, support: boolean): Pose {
  const bench = flatBench({ view: 'side', x: 146, top: 90, length: 192 });
  const front: LimbSpec = { target: [310, G - A], foot: 0, side: [1, 0] };
  // The rear ankle stays on the bench. The foot points back so its top, not its toes, contacts the pad.
  const rear: LimbSpec = { target: [150, bench.seatY - A], foot: 180, side: [1, 0] };
  const pose: Pose = {
    hip: lerpV([249, 272], [226, 334], p),
    spine: { lumbar: lerp(-89, -84, p), thoracic: lerp(-91, -87, p) },
    neck: -86, head: -88,
    legs: { near: front, far: rear },
    arms: { near: handOnHip(0), far: handOnHip(-4) },
  };
  if (bar) pose.arms = backRackArms();
  if (support) {
    pose.arms = {
      near: { target: [355, 238], side: [0, 1], hand: 90 },
      far: handOnHip(-4),
    };
  }
  return pose;
}

function slidePose(p: number): Pose {
  const front: LimbSpec = { target: [X, G - A], foot: 0, side: [1, 0] };
  const slider: LimbSpec = { target: [lerp(X - 6, X - 132, p), G - A], foot: 0, side: [1, 0] };
  return {
    hip: lerpV(STANDING_HIP, [X - 42, G - 151], p),
    spine: { lumbar: lerp(-89, -86, p), thoracic: lerp(-91, -88, p) },
    neck: -86, head: -88,
    legs: { near: front, far: slider },
    arms: { near: handOnHip(0), far: handOnHip(-4) },
  };
}

/** The advancing thigh lifts to hip height before the foot travels forward into the lunge. */
function highKneeLunge(p: number, lead: 'near' | 'far'): Pose {
  const lift = p <= 0.55 ? Math.sin(Math.PI * p / 0.55) : 0;
  const lungeP = smooth(clamp((p - 0.55) / 0.45, 0, 1));
  if (lift < 0.01) return ordinaryLunge('forward', lungeP, lead);
  const raised: LimbSpec = { a1: lerp(90, -40, lift), a2: lerp(90, 72, lift), foot: lerp(0, 65, lift) };
  const planted: LimbSpec = { target: [X - 6, G - A], foot: 0, side: [1, 0] };
  return {
    hip: STANDING_HIP,
    spine: { lumbar: -89, thoracic: -91 }, neck: -86, head: -88,
    legs: lead === 'near' ? { near: raised, far: planted } : { near: planted, far: raised },
    arms: { near: handOnHip(0), far: handOnHip(-4) },
  };
}

/** Builds bodyweight, band and barbell lunge variants with exact planted-foot targets. */
export function sideLunge(opts: SideLungeOptions): SideExercise {
  const bench = opts.kind === 'bulgarian' ? flatBench({ view: 'side', x: 146, top: 90, length: 192 }) : undefined;
  const platform = opts.kind === 'deficit' ? aerobicStep({ x: X - 4, h: 31, w: 164 }) : undefined;
  const tl = opts.walking ? walkingTL : repTL;
  const e = (t: number) => phase(t, !!opts.alternate, tl).e;
  const dynamic = [
    ...(opts.bar ? [barbell({ view: 'side', at: (J: Joints) => ({ p: add(J.S, [-30, -22]) }) })] : []),
    ...(opts.band === 'ankles' ? [bandLine((J: Joints) => [J.ankle_f, J.ankle_n], 'underNearArm', 'Ankle Band')] : []),
    ...(opts.band === 'thighs' ? [bandCurve((J: Joints) => [
      add(J.knee_f, [-3, -7]), add(J.knee_f, [4, 2]), add(J.knee_n, [4, 6]), add(J.knee_n, [-3, -4]), add(J.knee_f, [-3, -7]),
    ], 'underNearArm', 'Thigh Band')] : []),
  ];
  return {
    id: opts.id, name: opts.name,
    tl: opts.alternate ? { total: tl.total * 2, at: (t) => tl.at((t % 0.5) * 2) } : tl,
    meta: opts.meta,
    muscles: [
      ...lungeMuscles(!!opts.alternate, e, tl),
      ...(opts.overhead ? [{ m: 'delts' as const, side: 'both' as const, scale: 0.4, e }] : []),
      ...(opts.bar ? [{ m: 'upperBack' as const, scale: 0.3, e }] : []),
    ],
    props: (pal) => ({
      back: [
        ...(bench?.draw(pal) ?? []), ...(platform?.draw(pal) ?? []),
        ...(opts.support ? [
          { kind: 'box' as const, nm: 'support-post', color: pal.metalDark, c: [358, 324] as Vec2, s: [10, 238] as Vec2, r: 4 },
          { kind: 'box' as const, nm: 'support-rail', color: pal.metal, c: [340, 238] as Vec2, s: [46, 9] as Vec2, r: 4 },
        ] : []),
        ...(opts.kind === 'slide' ? [
          { kind: 'box' as const, nm: 'slide-board', color: pal.prop, c: [202, G - 4] as Vec2, s: [152, 8] as Vec2, r: 4 },
          { kind: 'box' as const, nm: 'slide-surface', color: pal.propLight, c: [202, G - 9] as Vec2, s: [142, 4] as Vec2, r: 2 },
        ] : []),
      ] as PropShape[],
    }),
    propsBox: opts.support ? [50, 364] : bench ? bench.box : platform ? platform.box : opts.kind === 'slide' ? [120, 284] : undefined,
    dynamic,
    pose: (t) => {
      const { side, p } = phase(t, !!opts.alternate, tl);
      if (opts.kind === 'bulgarian') return bulgarianPose(p, !!opts.bar, !!opts.support);
      if (opts.kind === 'slide') return slidePose(p);
      if (opts.highKnee) return highKneeLunge(p, side);
      const pose = ordinaryLunge(opts.kind, p, side);
      pose.arms = opts.bar ? backRackArms() : opts.overhead ? overheadArms(p) : pose.arms;
      return pose;
    },
  };
}

interface StepUpOptions {
  id: string;
  name: string;
  meta: LibraryMeta;
  bar?: boolean;
  band?: boolean;
  alternate?: boolean;
  extendTrail?: boolean;
}

/** Builds a full step-up: both feet begin on the floor; the trailing leg can extend behind the step. */
export function stepUp(opts: StepUpOptions): SideExercise {
  const step = aerobicStep({ x: 320, h: 70, w: 190 });
  const e = (t: number) => phase(t, !!opts.alternate, repTL).e;
  return {
    id: opts.id, name: opts.name,
    tl: opts.alternate ? { total: repTL.total * 2, at: (t) => repTL.at((t % 0.5) * 2) } : repTL,
    meta: opts.meta,
    muscles: [
      { m: 'quads', side: 'both', e }, { m: 'glutes', e }, { m: 'calves', side: 'both', scale: 0.35, e },
      ...(opts.bar ? [{ m: 'upperBack' as const, scale: 0.3, e }] : []),
    ],
    props: (pal) => ({ back: step.draw(pal) }), propsBox: step.box,
    dynamic: [
      ...(opts.bar ? [barbell({ view: 'side', at: (J: Joints) => ({ p: add(J.S, [-30, -22]) }) })] : []),
      ...(opts.band ? [bandCurve((J: Joints) => [
        add(J.knee_f, [-3, -6]), add(J.knee_f, [4, 2]), add(J.knee_n, [4, 6]), add(J.knee_n, [-3, -4]), add(J.knee_f, [-3, -6]),
      ], 'underNearArm', 'Thigh Band')] : []),
    ],
    pose(t) {
      const { side, p } = phase(t, !!opts.alternate, repTL);
      const q = smooth(p);
      const work: LimbSpec = { target: [lerp(250, 320, q), lerp(G - A, step.top - A, q)], foot: 0, side: [1, 0] };
      // Band step-ups finish with the unweighted leg extended behind the body. Other step-ups place both feet on the platform.
      const trail: LimbSpec = opts.extendTrail
        ? { target: [lerp(244, 140, q), lerp(G - A, step.top - 127, q)], foot: 0, side: [1, 0] }
        : { target: [lerp(244, 314, q), lerp(G - A, step.top - A, q)], foot: 0, side: [1, 0] };
      const pose: Pose = {
        hip: lerpV([242, G - A - 183.7], [310, step.top - A - 183.7], q),
        spine: { lumbar: -89, thoracic: -91 }, neck: -86, head: -88,
        legs: side === 'near' ? { near: work, far: trail } : { near: trail, far: work },
        arms: opts.bar ? backRackArms() : { near: handOnHip(0), far: handOnHip(-4) },
      };
      return pose;
    },
  };
}

interface FrontLungeOptions {
  id: string;
  name: string;
  meta: LibraryMeta;
  kind: 'forward-twist' | 'reverse-twist' | 'curtsy';
}

const frontTL = timeline([
  { d: 1.1, from: 0, to: 1, e: [0.2, 1] },
  { d: 0.3, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.45, from: 1, to: 0, e: [0.8, 0.35] },
  { d: 0.45, from: 0, to: 0, e: [0.3, 0.2] },
]);

/** A front-view toe direction that puts the toe center at its normal 7 px height above the floor. */
const frontToe = (ankle: Vec3): Vec3 => {
  const dy = 7 - ankle[1];
  return [0, dy, Math.sqrt(Math.max(1, 38 * 38 - dy * dy))];
};

/** Front-view lunge builder. Depth gives the step while the yaw and crossed arms make the torso rotation readable. */
export function frontLunge(opts: FrontLungeOptions): FrontExercise {
  const frontPhase = (t: number) => {
    const rep = t < 0.5 ? 0 : 1;
    const r = frontTL.at((t % 0.5) * 2);
    return { lead: rep === 0 ? 'l' as const : 'r' as const, p: r.p, e: r.e };
  };
  return {
    id: opts.id, name: opts.name, view: 'front',
    tl: { total: frontTL.total * 2, at: (t) => frontTL.at((t % 0.5) * 2) },
    meta: opts.meta,
    muscles: [
      { m: 'quads', side: 'l', e: (t) => frontPhase(t).lead === 'l' ? frontPhase(t).e : 0.2 * frontPhase(t).e },
      { m: 'quads', side: 'r', e: (t) => frontPhase(t).lead === 'r' ? frontPhase(t).e : 0.2 * frontPhase(t).e },
      { m: 'abs', scale: opts.kind === 'curtsy' ? 0.3 : 0.8, e: (t) => frontPhase(t).e },
      { m: 'obliques', scale: opts.kind === 'curtsy' ? 0.25 : 0.7, e: (t) => frontPhase(t).e },
      { m: 'glutes', region: { view: 'front', part: 'pelvis', c: [18, 1], s: [20, 22] }, e: (t) => frontPhase(t).e },
    ],
    pose(t) {
      const { lead, p } = frontPhase(t);
      const sign = lead === 'l' ? 1 : -1;
      const standL: Vec3 = [17, BODY.ankleH, 4];
      const standR: Vec3 = [-17, BODY.ankleH, 4];
      const isCurtsy = opts.kind === 'curtsy';
      const leadEnd: Vec3 = [17 * sign, BODY.ankleH, isCurtsy ? 6 : opts.kind === 'forward-twist' ? 66 : 10];
      const rearEnd: Vec3 = isCurtsy
        ? [30 * sign, 30, -80]
        : [-17 * sign, 30, -98];
      const lTarget = lead === 'l'
        ? lerp3(standL, leadEnd, p)
        : lerp3(standL, rearEnd, p);
      const rTarget = lead === 'r'
        ? lerp3(standR, leadEnd, p)
        : lerp3(standR, rearEnd, p);
      const yaw = isCurtsy ? 0 : 28 * sign * p;
      const pelvis: Vec3 = lerp3([0, BODY.ankleH + 183.8, 0], [0, BODY.ankleH + 118, isCurtsy ? -7 : -10], p);
      const downHand = (s: 1 | -1): Vec3 => [33 * s, -101, 13];
      return {
        pelvis,
        hips: { yaw: yaw * 0.25 }, spine: { yaw: yaw * 0.75 }, neck: { yaw: -yaw * 0.15 }, head: { yaw: -yaw * 0.2 },
        legs: {
          l: { target: lTarget, pole: [12, 0, 65], dir: frontToe(lTarget) },
          r: { target: rTarget, pole: [-12, 0, 65], dir: frontToe(rTarget) },
        },
        arms: isCurtsy ? {
          l: { target: (J) => add3(J.shoulder_l, downHand(1)), pole: [0, 0, -1] },
          r: { target: (J) => add3(J.shoulder_r, downHand(-1)), pole: [0, 0, -1] },
        } : {
          l: lead === 'l'
            ? { target: (J) => lerp3(add3(J.shoulder_l, downHand(1)), add3(J.B(0.44), [8, -18, 28]), p), pole: [0, 0, -1] }
            : { target: (J) => lerp3(add3(J.shoulder_l, downHand(1)), add3(J.B(0.57), [-18, -5, 25]), p), pole: [0, 0, -1] },
          r: lead === 'r'
            ? { target: (J) => lerp3(add3(J.shoulder_r, downHand(-1)), add3(J.B(0.44), [-8, -18, 28]), p), pole: [0, 0, -1] }
            : { target: (J) => lerp3(add3(J.shoulder_r, downHand(-1)), add3(J.B(0.57), [18, -5, 25]), p), pole: [0, 0, -1] },
        },
      };
    },
  };
}
