// Private builders for squat-1. Standing variations keep both soles planted while the hips travel back and down.
// Back, front, hack, Jefferson, band-row, Smith, and kneeling variants use distinct bar, hand, and support contacts.
// The bottom positions target parallel or full-depth knee and hip flexion without reaching through the floor.
import type { EquipmentTag, FrontExercise, MovingPart, SideExercise } from '@/exercise.ts';
import { add, clamp, lerp, mul, sub, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline, type Timeline } from '@/math/timeline.ts';
import { add3, lerp3, type Vec3 } from '@/math/vec3.ts';
import { project, toeDir, type FrontJoints } from '@/rig/front.ts';
import { BODY, type Joints, type Pose } from '@/rig/side.ts';
import { A, G, GRIP_IN_HAND, standLegs } from '@/exercises/common.ts';
import { barbell, bandCurve, bandLine, flatBench, miniBandPoints, plyoBox, smithRails } from '@/exercises/equipment/index.ts';

type Info = {
  id: string;
  name: string;
  en: string;
  equipment: EquipmentTag[];
  sources: string[];
};

type BackOptions = {
  bar?: 'standard' | 'high' | 'low';
  depth?: 'parallel' | 'deep';
  bench?: 'bench' | 'box';
  banded?: boolean;
  chain?: boolean;
  speed?: boolean;
  wide?: boolean;
};

type FrontOptions = {
  grip: 'clean' | 'cross' | 'frankenstein' | 'zercher';
  bench?: boolean;
  deep?: boolean;
};

const X = 280;
const squatTL = timeline([
  { d: 1.25, from: 0, to: 1, e: [0.35, 1] },
  { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.35, from: 1, to: 0, e: [0.85, 0.4] },
  { d: 0.45, from: 0, to: 0, e: [0.4, 0.3] },
]);
const speedTL = timeline([
  { d: 1.25, from: 0, to: 1, e: [0.3, 0.8] },
  { d: 0.16, from: 1, to: 1, e: [0.8, 1] },
  { d: 0.72, from: 1, to: 0, e: [1, 0.45] },
  { d: 0.42, from: 0, to: 0, e: [0.45, 0.3] },
]);

const meta = (info: Info) => ({ en: info.en, family: 'squat', equipment: info.equipment, sources: info.sources });

/** The bar is on the upper back. Lower-bar placement is slightly farther down the torso and more posterior. */
function backBar(J: Joints, kind: BackOptions['bar'] = 'standard'): Vec2 {
  const s = kind === 'high' ? 0.94 : kind === 'low' ? 0.79 : 0.87;
  const behind = kind === 'low' ? -12 : -8;
  return add(J.B(s), mul(J.A(s), behind));
}

/** The front-rack bar touches the front deltoids rather than floating in front of the chest. */
function frontBar(J: Joints): Vec2 {
  return add(J.B(0.88), mul(J.A(0.88), 17));
}

function backArms(kind: BackOptions['bar'] = 'standard'): Pose['arms'] {
  return {
    near: {
      target: (J) => add(backBar(J, kind), mul(J.T(0.86), 3)),
      side: (J) => mul(J.A(0.86), -1),
      hand: 180,
    },
    far: {
      target: (J) => add(add(backBar(J, kind), sub(J.Sf, J.S)), mul(J.T(0.86), 3)),
      side: (J) => mul(J.A(0.86), -1),
      hand: 180,
    },
  };
}

function frontRackArms(style: 'clean' | 'cross'): Pose['arms'] {
  const forward = style === 'clean' ? 1 : 0.55;
  return {
    near: {
      target: (J) => add(frontBar(J), mul(J.T(0.86), style === 'clean' ? -2 : 9)),
      side: (J) => mul(J.A(0.82), forward),
      hand: 0,
    },
    far: {
      target: (J) => add(add(frontBar(J), sub(J.Sf, J.S)), mul(J.T(0.86), style === 'clean' ? -7 : 3)),
      side: (J) => mul(J.A(0.82), forward),
      hand: 0,
    },
  };
}

function squatPose(p: number, opts: { torso: number; back: number; bottom: number; arms: Pose['arms'] }): Pose {
  const travel = Math.sin((p * Math.PI) / 2);
  const sink = 1 - Math.cos((p * Math.PI) / 2);
  const lean = lerp(2, opts.torso, p);
  return {
    // Start directly over the planted ankles at the full thigh-plus-shin length: knees and hips are tall at lockout.
    hip: [lerp(X, X - opts.back, travel), lerp(G - A - BODY.thigh - BODY.shin, G - A - opts.bottom, sink)],
    spine: { lumbar: -90 + lean, thoracic: -92 + lean },
    neck: -88 + lean * 0.75,
    head: -90 + lean * 0.48,
    legs: standLegs(X, 0),
    arms: opts.arms,
  };
}

function supportProps(kind: BackOptions['bench']) {
  if (!kind) return undefined;
  if (kind === 'box') {
    const box = plyoBox({ x: 140, h: 104, w: 126 });
    return { props: (pal: Parameters<typeof box.draw>[0]) => ({ back: box.draw(pal) }), propsBox: box.box };
  }
  const bench = flatBench({ view: 'side', x: 144, top: 106, length: 164 });
  return { props: (pal: Parameters<typeof bench.draw>[0]) => ({ back: bench.draw(pal) }), propsBox: bench.box };
}

/** Individual chain links shorten into a visible floor pool as the bar descends. */
function chainParts(at: (J: Joints) => Vec2): MovingPart<Joints>[] {
  return [-24, 24].flatMap((dx) => Array.from({ length: 13 }, (_, i) => ({
    nm: `Chain ${dx < 0 ? 'front' : 'rear'} link ${i}`,
    kind: 'rigid' as const,
    z: 'front' as const,
    shapes: (pal: { metalDark: string }) => [{ kind: 'ring' as const, nm: 'chain-link', color: pal.metalDark, c: [0, 0] as Vec2, s: [8, 14] as Vec2, w: 2 }],
    at: (J: Joints) => {
      const top = at(J);
      const u = i / 12;
      // The last links always rest at the floor; descent reduces the suspended length.
      return { p: [top[0] + dx, lerp(top[1] + 7, G - 9, u)] as Vec2, a: i % 2 ? 0 : 90 };
    },
  })));
}

function bandParts(at: (J: Joints) => Vec2): MovingPart<Joints>[] {
  return [
    bandLine((J) => [add(at(J), [-23, 1]), [X - 62, G - 8]], 'back', 'Front sleeve band'),
    bandLine((J) => [add(at(J), [23, 1]), [X + 43, G - 8]], 'back', 'Rear sleeve band'),
  ];
}

export function makeBackSquat(info: Info, opts: BackOptions = {}): SideExercise {
  const tl = opts.speed ? speedTL : squatTL;
  const depth = opts.depth === 'deep' ? 86 : opts.bench ? 98 : 104;
  const torso = opts.bar === 'low' ? 42 : opts.depth === 'deep' && opts.bar === 'high' ? 18 : 36;
  const back = opts.wide ? 76 : opts.bar === 'low' ? 82 : 74;
  const support = supportProps(opts.bench);
  const barAt = (J: Joints) => backBar(J, opts.bar);
  return {
    id: info.id,
    name: info.name,
    tl,
    meta: meta(info),
    muscles: [
      { m: 'quads', side: 'both' }, { m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.52 },
      { m: 'lowerBack', scale: 0.35 },
    ],
    ...(support ?? {}),
    dynamic: [
      barbell({ view: 'side', at: (J) => ({ p: barAt(J) }), plate: 'full' }),
      ...(opts.banded ? bandParts(barAt) : []),
      ...(opts.chain ? chainParts(barAt) : []),
    ],
    pose: (t) => squatPose(tl.at(t).p, { torso, back, bottom: depth, arms: backArms(opts.bar) }),
  };
}

export function makeFrontSquat(info: Info, opts: FrontOptions): SideExercise {
  const tl = squatTL;
  const support = opts.bench ? supportProps('bench') : undefined;
  const pose = (p: number): Pose => {
    const bottom = opts.deep ? 84 : opts.bench ? 98 : 101;
    const torso = opts.grip === 'zercher' ? 29 : 22;
    const arms: Pose['arms'] = opts.grip === 'frankenstein'
      ? {
          near: { a1: 0, a2: 0, hand: 0 },
          far: { a1: 2, a2: 2, hand: 2 },
        }
      : opts.grip === 'zercher'
        ? {
            near: { target: (J) => add(J.B(0.60), mul(J.A(0.60), 25)), side: (J) => mul(J.T(0.6), -1), hand: 0 },
            far: { target: (J) => add(add(J.B(0.60), mul(J.A(0.60), 22)), sub(J.Sf, J.S)), side: (J) => mul(J.T(0.6), -1), hand: 0 },
          }
        : frontRackArms(opts.grip);
    return squatPose(p, { torso, back: 63, bottom, arms });
  };
  return {
    id: info.id,
    name: info.name,
    tl,
    meta: meta(info),
    muscles: [
      { m: 'quads', side: 'both' }, { m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.42 },
      { m: 'abs', scale: 0.42 },
    ],
    ...(support ?? {}),
    dynamic: [barbell({
      view: 'side',
      at: (J) => ({ p: opts.grip === 'zercher' ? J.elbow_n : frontBar(J) }),
      plate: opts.grip === 'zercher' ? 'medium' : 'full',
    })],
    pose: (t) => pose(tl.at(t).p),
  };
}

export function makeHackSquat(info: Info): SideExercise {
  const barAt = (J: Joints): Vec2 => add(add(J.H, mul(J.A(0), -27)), mul(J.T(0), -18));
  const arms: Pose['arms'] = {
    near: { target: (J) => sub(barAt(J), [0, GRIP_IN_HAND]), side: [-1, 0], hand: 90 },
    far: { target: (J) => add(sub(barAt(J), [0, GRIP_IN_HAND]), sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
  };
  return {
    id: info.id,
    name: info.name,
    tl: squatTL,
    meta: meta(info),
    muscles: [{ m: 'quads', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.38 }, { m: 'glutes', scale: 0.34 }, { m: 'forearms', side: 'both', scale: 0.38 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: barAt(J) }), plate: 'full' })],
    pose: (t) => squatPose(squatTL.at(t).p, { torso: 16, back: 47, bottom: 103, arms }),
  };
}

export function makeJeffersonSquat(info: Info): SideExercise {
  const arms: Pose['arms'] = {
    // Locked elbows make the hands hooks; the side view hides the front-versus-rear hand offset.
    near: { a1: 90, a2: 90, hand: 90 },
    far: { a1: 91, a2: 91, hand: 91 },
  };
  return {
    id: info.id,
    name: info.name,
    tl: squatTL,
    meta: meta(info),
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.45 }, { m: 'lowerBack', scale: 0.35 }, { m: 'traps', scale: 0.3 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: add(J.wrist_n, [0, GRIP_IN_HAND]) }), plate: 'medium' })],
    pose: (t) => squatPose(squatTL.at(t).p, { torso: 13, back: 47, bottom: 104, arms }),
  };
}

export function makeKneelingSquat(info: Info): SideExercise {
  const knee: Vec2 = [280, G - 11];
  const tl = squatTL;
  const pose = (p: number): Pose => {
    const sit = smooth(p);
    const hip: Vec2 = [lerp(knee[0], knee[0] - 75, sit), lerp(knee[1] - BODY.thigh, knee[1] - 56, sit)];
    const thigh = lerp(90, 37, sit);
    return {
      hip,
      farHip: 0,
      spine: { lumbar: lerp(-90, -68, sit), thoracic: lerp(-92, -71, sit) },
      neck: lerp(-89, -73, sit),
      head: lerp(-90, -80, sit),
      legs: {
        near: { a1: thigh, a2: 180, foot: 180 },
        far: { a1: thigh, a2: 180, foot: 180 },
      },
      arms: backArms('standard'),
    };
  };
  return {
    id: info.id,
    name: info.name,
    tl,
    mat: true,
    meta: meta(info),
    muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.45 }, { m: 'abs', scale: 0.36 }, { m: 'lowerBack', scale: 0.35 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: backBar(J) }), plate: 'medium' })],
    pose: (t) => pose(tl.at(t).p),
  };
}

export function makeBandRowSquat(info: Info): SideExercise {
  const tl = timeline([
    { d: 1.10, from: 0, to: 1, e: [0.35, 0.8] },
    { d: 0.80, from: 1, to: 1, e: [0.8, 1] },
    { d: 1.40, from: 1, to: 0, e: [0.85, 0.35] },
    { d: 0.35, from: 0, to: 0, e: [0.35, 0.25] },
  ]);
  const anchor: Vec2 = [440, 264];
  const rowAt = (t: number): number => {
    const s = t * tl.total;
    if (s < 1.10) return 0;
    if (s < 1.32) return (s - 1.10) / 0.22;
    if (s < 1.57) return 1;
    if (s < 1.88) return 1 - (s - 1.57) / 0.31;
    return 0;
  };
  const grip = (J: Joints, t: number): Vec2 => {
    const r = rowAt(t);
    // Shoulder-to-handle distance stays just under the 126 px arm reach at the tall start.
    const extended: Vec2 = [330, 265];
    // Stop with the elbows around 75°, rather than pulling the handles into an extreme curl.
    const pulled = add(J.B(0.58), mul(J.A(0.58), 55));
    return [lerp(extended[0], pulled[0], r), lerp(extended[1], pulled[1], r)];
  };
  return {
    id: info.id,
    name: info.name,
    tl,
    meta: meta(info),
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes' }, { m: 'upperBack', scale: 0.7 }, { m: 'lats', scale: 0.5 }, { m: 'biceps', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: [
      { kind: 'box', nm: 'band-anchor-post', color: pal.metalDark, c: [456, 289], s: [12, 120], r: 3 },
      { kind: 'oval', nm: 'band-anchor', color: pal.metal, c: anchor, s: [16, 16] },
    ] }),
    propsBox: [128, 462],
    dynamic: [
      bandLine((J, t) => [anchor, grip(J, t)], 'underNearArm', 'Anchored resistance band'),
    ],
    pose: (t) => {
      const p = tl.at(t).p;
      return squatPose(p, {
        torso: 25,
        back: 62,
        bottom: 104,
        arms: {
          near: { target: (J) => grip(J, t), side: [-1, 0], hand: 0 },
          far: { target: (J) => add(grip(J, t), sub(J.Sf, J.S)), side: [-1, 0], hand: 0 },
        },
      });
    },
  };
}

/** Mini-band squat viewed from the front so the loop and outward knee tracking remain visible. */
export function makeBandSquat(info: Info): FrontExercise {
  const aboveKnee = (J: FrontJoints, side: 'l' | 'r'): Vec2 => project(lerp3(J[`hip_${side}`], J[`knee_${side}`], 0.76));
  const leg = (side: 'l' | 'r') => {
    const sign = side === 'l' ? 1 : -1;
    return {
      target: [sign * 46, BODY.ankleH, 0] as Vec3,
      // The outward pole keeps each knee aligned over its turned-out toe.
      pole: [sign * 80, 116, 42] as Vec3,
      dir: toeDir([sign * 0.55, 0, 1]),
    };
  };
  const arm = (side: 'l' | 'r') => {
    const sign = side === 'l' ? 1 : -1;
    return {
      target: (J: FrontJoints) => add3(J[`shoulder_${side}`], [sign * 30, -118, 0]),
      pole: [sign * 88, 210, -32] as Vec3,
    };
  };
  return {
    id: info.id,
    name: info.name,
    tl: squatTL,
    view: 'front',
    meta: meta(info),
    muscles: [
      { m: 'quads', side: 'both' },
      { m: 'glutes', scale: 0.55, region: { view: 'front', part: 'pelvis', c: [0, 0], s: [26, 22] } },
      { m: 'calves', side: 'both', scale: 0.25 },
    ],
    dynamic: [
      bandCurve((J) => miniBandPoints(aboveKnee(J, 'r'), aboveKnee(J, 'l'), 5), 'front', 'Band above knees'),
    ],
    pose: (t) => {
      const p = squatTL.at(t).p;
      return {
        pelvis: [0, lerp(BODY.ankleH + 182, BODY.ankleH + 101, p), lerp(0, -14, p)],
        hips: { pitch: 13 * p },
        spine: { pitch: -5 * p },
        head: { pitch: -4 * p },
        legs: { l: leg('l'), r: leg('r') },
        arms: { l: arm('l'), r: arm('r') },
      };
    },
  };
}

/** Smith-machine sumo squat. The wide feet and knees track outward in the frontal plane. */
export function makeSmithSumo(info: Info): FrontExercise {
  const tl = squatTL;
  const smith = smithRails({ view: 'front', x: 0, width: 330 });
  const leg = (side: 'l' | 'r', p: number) => {
    const sign = side === 'l' ? 1 : -1;
    const ankleX = lerp(62, 76, p) * sign;
    return { target: [ankleX, BODY.ankleH, 0] as Vec3, pole: [ankleX * 1.4, 116, 42] as Vec3 };
  };
  return {
    id: info.id,
    name: info.name,
    view: 'front',
    tl,
    meta: meta(info),
    muscles: [{ m: 'quads', side: 'both' }, { m: 'adductors', side: 'both', scale: 0.52 }, { m: 'abductors', scale: 0.38 }, { m: 'abs', scale: 0.3 }],
    props: (pal) => ({ back: smith.draw(pal) }),
    propsBox: smith.box,
    dynamic: [barbell<FrontJoints>({ view: 'front', at: (J) => ({ p: project(J.B(0.89)) }), plate: 'medium', z: 'underNearArm' })],
    pose: (t) => {
      const p = tl.at(t).p;
      // A 178 px standing pelvis height makes the knees nearly straight without exceeding the 184 px leg reach.
      const pelvisY = lerp(BODY.ankleH + 178, BODY.ankleH + 99, p);
      return {
        pelvis: [0, pelvisY, lerp(0, -18, p)],
        hips: { pitch: lerp(0, 16, p) },
        spine: { pitch: lerp(0, -7, p) },
        head: { pitch: lerp(0, -4, p) },
        legs: { l: leg('l', p), r: leg('r', p) },
        arms: {
          l: { target: (J) => add3(J.B(0.89), [104, 0, -8]), pole: [85, 230, -38] },
          r: { target: (J) => add3(J.B(0.89), [-104, 0, -8]), pole: [-85, 230, -38] },
        },
      };
    },
  };
}

/** Two alternating reach-and-twist repetitions, followed by a neutral stand so the loop is seamless. */
export function makeTwistReachSquat(info: Info): FrontExercise {
  const total = 5.0;
  const neutralSegment = { d: total, from: 0, to: 0, e: [0.3, 0.3] as [number, number] };
  const state = (t: number): { squat: number; reach: number; twist: number } => {
    const s = t * total;
    if (s < 0.8) return { squat: s / 0.8, reach: 0, twist: 0 };
    if (s < 1.55) return { squat: 1 - (s - 0.8) / 0.75, reach: (s - 0.8) / 0.75, twist: 26 };
    if (s < 2.15) return { squat: (s - 1.55) / 0.6, reach: 1 - (s - 1.55) / 0.6, twist: 26 * (1 - (s - 1.55) / 0.6) };
    if (s < 2.9) return { squat: 1 - (s - 2.15) / 0.75, reach: (s - 2.15) / 0.75, twist: -26 };
    if (s < 3.5) return { squat: (s - 2.9) / 0.6, reach: 1 - (s - 2.9) / 0.6, twist: -26 * (1 - (s - 2.9) / 0.6) };
    if (s < 4.2) return { squat: 1 - (s - 3.5) / 0.7, reach: 0, twist: 0 };
    return { squat: 0, reach: 0, twist: 0 };
  };
  return {
    id: info.id,
    name: info.name,
    view: 'front',
    tl: { total, at: (t) => ({ p: state(t).squat, e: 0.35 + 0.65 * state(t).squat, seg: neutralSegment, u: t }) },
    meta: meta(info),
    // The standing, overhead right-twist position identifies this combined movement better than the squat bottom.
    poster: 1.55 / total,
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.55, region: { view: 'front', part: 'pelvis', c: [0, 0], s: [24, 22] } }, { m: 'delts', side: 'both', scale: 0.48 }, { m: 'obliques', scale: 0.45 }],
    pose: (t) => {
      const { squat, reach, twist } = state(t);
      const pelvisY = lerp(BODY.ankleH + 184, BODY.ankleH + 101, squat);
      const arm = (side: 'l' | 'r') => {
        const sign = side === 'l' ? 1 : -1;
        return {
          target: (J: FrontJoints) => lerp3(
            add3(J[`shoulder_${side}`], [sign * 14, -117, 8]),
            add3(J[`shoulder_${side}`], [sign * 10, 124, 8]),
            reach,
          ),
          pole: [sign * 52, 218, -35] as Vec3,
        };
      };
      return {
        pelvis: [0, pelvisY, lerp(0, -14, squat)],
        hips: { pitch: 13 * squat },
        spine: { pitch: -5 * squat, yaw: twist },
        neck: { yaw: twist * 0.45 },
        head: { yaw: twist * 0.5 },
        legs: {
          l: { target: [lerp(23, 38, squat), BODY.ankleH, 0], pole: [38, 115, 42] },
          r: { target: [lerp(-23, -38, squat), BODY.ankleH, 0], pole: [-38, 115, 42] },
        },
        arms: { l: arm('l'), r: arm('r') },
      };
    },
  };
}
