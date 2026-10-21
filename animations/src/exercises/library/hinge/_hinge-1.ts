// Private builders for hinge-1. Each pose keeps feet or a bar grip as an IK target.
// Variations add only the visible setup that changes the movement: a rack, a platform, bands, chains, or a box.
import type { FrontExercise, MovingPart, PropShape, Props, SideExercise } from '@/exercise.ts';
import { add, clamp, lerp, sub, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline } from '@/math/timeline.ts';
import { toeDir, type FrontJoints, type FrontPose } from '@/rig/front.ts';
import type { Joints, LimbPair, Pose } from '@/rig/side.ts';
import { ARM_STRAIGHT, G, GRIP_IN_HAND, handOnHip, hipForShoulder } from '@/exercises/common.ts';
import { bandCurve, barbell, flatBench, frontGripAt, gripAt, PLATE, plyoBox } from '@/exercises/equipment/index.ts';

export const hingeTL = timeline([
  { d: 1.2, from: 0, to: 1, e: [0.55, 1] },
  { d: 0.35, from: 1, to: 1, e: [0.95, 0.85] },
  { d: 1.6, from: 1, to: 0, e: [0.82, 0.45] },
  { d: 0.45, from: 0, to: 0, e: [0.35, 0.3] },
]);

const X0 = 262;
const BX = X0 + 14;

const feet = (x = X0, floor = G, farDx = 0): LimbPair => ({
  near: { target: [x, floor - 13], foot: 0, side: [1, 0] },
  far: { target: [x + farDx, floor - 13], foot: 0, side: [1, 0] },
});

function liftTorso(h: number, kneeHeight: number, topHeight: number): { th: number; d: number } {
  if (h <= kneeHeight) {
    const u = clamp((h - PLATE.full / 2) / Math.max(1, kneeHeight - PLATE.full / 2), 0, 1);
    return { th: lerp(-26, -36, u), d: lerp(9, 3, u) };
  }
  const u = smooth(clamp((h - kneeHeight) / Math.max(1, topHeight - kneeHeight), 0, 1));
  return { th: lerp(-36, -91, u), d: lerp(3, -15, u) };
}

export interface DeadliftSpec {
  id: string;
  name: string;
  en: string;
  sources: string[];
  start?: number;
  knee?: number;
  top?: number;
  floor?: number;
  x?: number;
  barX?: number;
  farDx?: number;
  muscles?: SideExercise['muscles'];
  equipment?: Array<'barbell' | 'band' | 'other' | 'box'>;
  props?: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => Props;
  propsBox?: [number, number];
  extra?: MovingPart<Joints>[];
}

/** Conventional pull geometry, with a straight-arm grip derived from the bar's height. */
export function barDeadlift(spec: DeadliftSpec): SideExercise {
  const start = spec.start ?? PLATE.full / 2;
  const knee = spec.knee ?? 100;
  const top = spec.top ?? 168;
  const floor = spec.floor ?? G;
  const x = spec.x ?? X0;
  const bx = spec.barX ?? BX;
  const height = (t: number): number => lerp(start, top, hingeTL.at(t).p);
  const pose = (h: number): Pose => {
    const { th, d } = liftTorso(h, knee, top);
    const grip: Vec2 = [bx, G - h];
    const wrist: Vec2 = [bx, grip[1] - GRIP_IN_HAND];
    const dy = Math.sqrt(ARM_STRAIGHT * ARM_STRAIGHT - d * d);
    const shoulder: Vec2 = [bx + d, wrist[1] - dy];
    const spine = { lumbar: th + 1, thoracic: th - 1 };
    return {
      hip: hipForShoulder(shoulder, spine), spine, neck: th + 3, head: th + 1,
      farHip: 0,
      legs: feet(x, floor, spec.farDx ?? 0),
      arms: {
        near: { target: wrist, side: [-1, 0], hand: 90 },
        far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
      },
    };
  };
  return {
    id: spec.id, name: spec.name, tl: hingeTL,
    meta: { en: spec.en, family: 'hinge', equipment: spec.equipment ?? ['barbell'], sources: spec.sources },
    muscles: spec.muscles ?? [
      { m: 'glutes' }, { m: 'hamstrings', side: 'both' }, { m: 'lowerBack', scale: 0.75 },
      { m: 'quads', side: 'both', scale: 0.6 }, { m: 'traps', scale: 0.35 }, { m: 'forearms', side: 'both', scale: 0.35 },
    ],
    props: spec.props,
    propsBox: spec.propsBox ?? [bx - PLATE.full / 2, bx + PLATE.full / 2],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) }), ...(spec.extra ?? [])],
    poster: 0.42,
    pose: (t) => pose(height(t)),
  };
}

export interface RdlSpec {
  id: string;
  name: string;
  en: string;
  sources: string[];
  floor?: number;
  deficit?: boolean;
  muscles?: SideExercise['muscles'];
  equipment?: Array<'barbell' | 'box'>;
  props?: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => Props;
  propsBox?: [number, number];
  stiff?: boolean;
}

/** Romanian and stiff-leg pulls: a small fixed knee bend, hips back, long arms and a neutral spine. */
export function barRdl(spec: RdlSpec): SideExercise {
  const floor = spec.floor ?? G;
  const stiff = spec.stiff ?? false;
  const pose = (p: number): Pose => {
    // The deficit version reaches farther by lowering the hips at the bottom. The knees remain short of a squat.
    const hipTop: Vec2 = stiff ? [X0 - 3, floor - 13 - 183] : [X0 - 8, floor - 13 - 180];
    const hipBottom: Vec2 = spec.deficit
      ? [X0 - 70, floor - 13 - 130]
      : stiff ? [X0 - 62, floor - 13 - 172] : [X0 - 66, floor - 13 - 169];
    const aTop = 86, aBottom = spec.deficit ? 96 : 100;
    const spineBottom = spec.deficit ? -9 : -15;
    const arm = lerp(aTop, aBottom, p);
    return {
      hip: [lerp(hipTop[0], hipBottom[0], p), lerp(hipTop[1], hipBottom[1], p)],
      spine: { lumbar: lerp(-88, spineBottom, p), thoracic: lerp(-90, spineBottom - 2, p) },
      neck: lerp(-85, spineBottom + 2, p), head: lerp(-87, spineBottom + 4, p),
      farHip: 0,
      legs: feet(X0, floor, 0),
      arms: {
        near: { a1: arm, a2: arm - 2, hand: arm - 2 },
        far: { a1: arm + 1, a2: arm - 1, hand: arm - 1 },
      },
    };
  };
  return {
    id: spec.id, name: spec.name, tl: hingeTL,
    meta: { en: spec.en, family: 'hinge', equipment: spec.equipment ?? ['barbell'], sources: spec.sources },
    muscles: spec.muscles ?? [{ m: 'hamstrings', side: 'both' }, { m: 'glutes' }, { m: 'lowerBack', scale: 0.55 }, { m: 'forearms', side: 'both', scale: 0.35 }],
    props: spec.props,
    propsBox: spec.propsBox,
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    poster: 0.34,
    pose: (t) => pose(hingeTL.at(t).p),
  };
}

export interface GoodMorningSpec {
  id: string;
  name: string;
  en: string;
  sources: string[];
  band?: 'under-feet' | 'rear-anchor';
  bar?: boolean;
  stiff?: boolean;
  offPins?: boolean;
  startTall?: boolean;
}

/** Hinge from a soft-knee standing pose while the shoulders retain a bar or band behind the neck. */
export function goodMorning(spec: GoodMorningSpec): SideExercise {
  const pose = (p: number): Pose => {
    const hipTop: Vec2 = [X0 - 5, G - 13 - 180];
    const hipBottom: Vec2 = spec.stiff ? [X0 - 50, G - 13 - 175] : [X0 - 57, G - 13 - 168];
    const bottom = -4;
    return {
      hip: [lerp(hipBottom[0], hipTop[0], p), lerp(hipBottom[1], hipTop[1], p)],
      spine: { lumbar: lerp(bottom, -90, p), thoracic: lerp(bottom - 2, -92, p) },
      neck: lerp(bottom + 2, -87, p), head: lerp(bottom + 3, -89, p),
      farHip: 0,
      legs: feet(X0, G, 0),
      arms: {
        near: { target: (J) => add(J.B(0.88), [-11, 3]), side: [0, -1], hand: 175 },
        far: { target: (J) => add(J.B(0.88), [-15, -2]), side: [0, -1], hand: 175 },
      },
    };
  };
  const pinY = 242;
  const rack = (pal: Parameters<NonNullable<SideExercise['props']>>[0]): Props => ({ back: [
    { kind: 'box', nm: 'rack-post', color: pal.prop, c: [145, 270], s: [16, 336], r: 4 },
    { kind: 'box', nm: 'rack-foot', color: pal.metalDark, c: [170, G - 4], s: [100, 8], r: 3 },
    { kind: 'box', nm: 'rack-pin', color: pal.metal, c: [196, pinY], s: [104, 8], r: 3 },
  ] });
  const rearAnchor = (pal: Parameters<NonNullable<SideExercise['props']>>[0]): Props => ({ back: [
    { kind: 'box', nm: 'anchor-post', color: pal.prop, c: [126, 294], s: [18, 312], r: 4 },
    { kind: 'box', nm: 'anchor-foot', color: pal.metalDark, c: [146, G - 4], s: [74, 8], r: 3 },
    { kind: 'oval', nm: 'band-anchor', color: pal.metal, c: [134, G - 22], s: [16, 16] },
  ] });
  const dynamic: MovingPart<Joints>[] = [];
  if (spec.bar) dynamic.push(barbell({ view: 'side', at: (J) => ({ p: add(J.B(0.88), [-10, 0]) }) }));
  if (spec.band === 'under-feet') dynamic.push(bandCurve((J) => [
    [X0 - 10, G - 5], [X0 - 18, G - 35], add(J.B(0.93), [-16, 9]), add(J.B(0.88), [-8, 0]),
  ], 'underNearArm', 'Band under feet'));
  if (spec.band === 'rear-anchor') dynamic.push(bandCurve((J) => [
    [134, G - 22], [157, G - 60], add(J.B(0.93), [-25, 12]), add(J.B(0.88), [-9, 0]),
  ], 'underNearArm', 'Rear-anchored band'));
  return {
    id: spec.id, name: spec.name, tl: hingeTL,
    meta: { en: spec.en, family: 'hinge', equipment: spec.bar ? ['barbell'] : ['band'], sources: spec.sources },
    muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes' }, { m: 'lowerBack', scale: 0.65 }],
    props: spec.offPins ? rack : spec.band === 'rear-anchor' ? rearAnchor : undefined,
    propsBox: spec.offPins ? [120, 310] : spec.band === 'rear-anchor' ? [110, 310] : undefined,
    dynamic,
    poster: spec.startTall ? 0.34 : 0,
    pose: (t) => {
      const p = hingeTL.at(t).p;
      return pose(spec.startTall ? 1 - p : p);
    },
  };
}

/** Low rear anchor, hands pass between the legs, and a hip hinge pulls the band forward. */
export function bandPullThrough(): SideExercise {
  const pose = (p: number): Pose => {
    const hip: Vec2 = [lerp(205, 257, p), lerp(271, 259, p)];
    const a = lerp(-4, -90, p);
    const handDrop = lerp(48, 18, p);
    return {
    hip, spine: { lumbar: a, thoracic: a - 2 }, neck: a + 2, head: a + 4,
    farHip: 0,
    legs: feet(X0, G, 0),
    arms: {
        near: { target: (J) => add(J.B(0.2), [12, handDrop]), side: [-1, 0], hand: 90 },
        far: { target: (J) => add(J.B(0.2), [8, handDrop - 1]), side: [-1, 0], hand: 90 },
      },
    };
  };
  return {
    id: 'band-pull-through', name: '弹力带胯下拉', tl: hingeTL,
    meta: { en: 'Band Pull-Through', family: 'hinge', equipment: ['band'], sources: ['hz:0991'] },
    muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.65 }, { m: 'lowerBack', scale: 0.4 }],
    props: (pal) => ({ back: [
      { kind: 'box', nm: 'low-anchor-post', color: pal.prop, c: [122, 376], s: [18, 148], r: 4 },
      { kind: 'box', nm: 'anchor-foot', color: pal.metalDark, c: [143, G - 4], s: [72, 8], r: 3 },
      { kind: 'oval', nm: 'band-anchor', color: pal.metal, c: [136, G - 28], s: [16, 16] },
    ] }),
    propsBox: [108, 302],
    dynamic: [bandCurve((J) => [[136, G - 28], [170, G - 22], add(J.wrist_n, [0, 9])], 'underNearArm', 'Pull-through band')],
    poster: 0.34,
    pose: (t) => pose(1 - hingeTL.at(t).p),
  };
}

/** The band runs from under the feet to long arms in front of the thighs during a stiff-leg hinge. */
export function bandStiffLeg(): SideExercise {
  const pose = (p: number): Pose => {
    const hipTop: Vec2 = [X0 - 8, G - 13 - 180];
    const hipBottom: Vec2 = [X0 - 62, G - 13 - 172];
    const spine = lerp(-88, -15, p);
    const arm = lerp(86, 100, p);
    return {
      hip: [lerp(hipTop[0], hipBottom[0], p), lerp(hipTop[1], hipBottom[1], p)],
      spine: { lumbar: spine, thoracic: spine - 2 }, neck: spine + 3, head: spine + 4,
      legs: feet(X0, G, -10),
      arms: {
        near: { a1: arm, a2: arm - 2, hand: arm - 2 },
        far: { a1: arm + 1, a2: arm - 1, hand: arm - 1 },
      },
    };
  };
  return {
    id: 'band-stiff-leg-deadlift', name: '弹力带直腿硬拉', tl: hingeTL,
    meta: { en: 'Band Stiff-Leg Deadlift', family: 'hinge', equipment: ['band'], sources: ['hz:1009', 'hz:1023', 'hz:1010'] },
    muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both' }, { m: 'lowerBack', scale: 0.55 }],
    dynamic: [bandCurve((J) => [[X0 - 12, G - 5], [X0 - 17, G - 31], add(gripAt(J, 'n'), [-8, 8]), gripAt(J, 'n')], 'underNearArm', 'Band under feet')],
    poster: 0.34,
    pose: (t) => pose(hingeTL.at(t).p),
  };
}

export function rackProps(pinY: number, overhead = false): (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => Props {
  return (pal) => ({ back: [
    { kind: 'box', nm: 'rack-post-back', color: pal.prop, c: [133, 242], s: [16, 410], r: 4 },
    { kind: 'box', nm: 'rack-post-front', color: pal.prop, c: [365, 242], s: [16, 410], r: 4 },
    { kind: 'box', nm: 'rack-top', color: pal.prop, c: [249, 40], s: [248, 14], r: 4 },
    { kind: 'box', nm: 'rack-foot', color: pal.metalDark, c: [166, G - 4], s: [102, 8], r: 3 },
    { kind: 'box', nm: 'rack-pin', color: pal.metal, c: [202, pinY], s: [140, 8], r: 3 },
    ...(overhead ? [
      { kind: 'oval' as const, nm: 'band-peg-back', color: pal.metal, c: [166, 55] as Vec2, s: [14, 14] as Vec2 },
      { kind: 'oval' as const, nm: 'band-peg-front', color: pal.metal, c: [332, 55] as Vec2, s: [14, 14] as Vec2 },
    ] : []),
  ] });
}

export function footBands(): MovingPart<Joints>[] {
  return [bandCurve((J) => {
    const bar = gripAt(J, 'n');
    return [[X0 - 15, G - 6], [X0 - 20, G - 26], [bar[0] - 10, bar[1] + 16], bar];
  }, 'underNearArm', 'Band under feet')];
}

/** Bands attach to the rack base and pull upward on the bar in a rack pull. */
export function rackBaseBands(): MovingPart<Joints>[] {
  return [bandCurve((J) => {
    const bar = gripAt(J, 'n');
    return [[166, G - 18], [181, G - 46], [bar[0] - 12, bar[1] + 22], bar];
  }, 'underNearArm', 'Rack-base band')];
}

export function reverseBands(): MovingPart<Joints>[] {
  return [
    bandCurve((J) => [[166, 55], [172, 128], [gripAt(J, 'n')[0] - 14, gripAt(J, 'n')[1] - 26], gripAt(J, 'n')], 'underNearArm', 'Left reverse band'),
    bandCurve((J) => [[332, 55], [326, 128], [gripAt(J, 'n')[0] + 15, gripAt(J, 'n')[1] - 26], gripAt(J, 'n')], 'back', 'Right reverse band'),
  ];
}

export function barChains(): MovingPart<Joints>[] {
  return [{
    nm: 'Hanging chain', kind: 'curve', z: 'front', width: 6,
    color: (pal) => pal.metalDark,
    at: (J) => {
      const bar = gripAt(J, 'n');
      return [bar, [bar[0] + 20, Math.min(G - 30, bar[1] + 46)], [bar[0] + 28, G - 18], [bar[0] + 13, G - 4]];
    },
  }];
}

/** One hand controls a transverse bar at the outside of the near leg; the free hand stays on the hip. */
export function suitcaseDeadlift(id: string, name: string, en: string, sources: string[]): SideExercise {
  const top = 164, low = PLATE.full / 2, bx = 310;
  const alternateTL = {
    total: hingeTL.total * 2,
    at: (t: number) => hingeTL.at(t < 0.5 ? t * 2 : (t - 0.5) * 2),
  };
  const sideAt = (t: number): 'near' | 'far' => t < 0.5 ? 'near' : 'far';
  const height = (t: number) => lerp(low, top, alternateTL.at(t).p);
  return {
    id, name, tl: alternateTL,
    meta: { en, family: 'hinge', equipment: ['barbell'], sources },
    muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both' }, { m: 'quads', side: 'both', scale: 0.55 }, { m: 'lowerBack', scale: 0.55 }, { m: 'obliques', scale: 0.45 }],
    dynamic: [barbell({ view: 'side', at: (J, t) => ({ p: gripAt(J, sideAt(t) === 'near' ? 'n' : 'f') }) })],
    propsBox: [bx - PLATE.full / 2, bx + PLATE.full / 2], poster: 0.42,
    pose: (t) => {
      const h = height(t), working = sideAt(t);
      const { th, d } = liftTorso(h, 100, top);
      const grip: Vec2 = [bx, G - h];
      const wrist: Vec2 = [bx, grip[1] - GRIP_IN_HAND];
      const shoulder: Vec2 = [bx + d, wrist[1] - Math.sqrt(ARM_STRAIGHT * ARM_STRAIGHT - d * d)];
      const spine = { lumbar: th + 1, thoracic: th - 1 };
      return {
        // farShoulder 0: the straight far arm must reach the same bar position as the near arm.
        hip: hipForShoulder(shoulder, spine), spine, neck: th + 3, head: th + 1, farHip: 0, farShoulder: 0,
        legs: feet(X0, G, 0),
        arms: working === 'near'
          ? { near: { target: wrist, side: [-1, 0], hand: 90 }, far: handOnHip(-4) }
          : { near: handOnHip(-4), far: { target: wrist, side: [-1, 0], hand: 90 } },
      };
    },
  };
}

/** A two-hand barbell reaches toward the floor while the far leg counterbalances behind the body. */
export function singleLegDeadlift(): SideExercise {
  const pose = (p: number): Pose => {
    const hip: Vec2 = [lerp(258, 199, p), lerp(259, 300, p)];
    const spine = lerp(-90, -25, p);
    const arm = lerp(86, 101, p);
    return {
      hip, spine: { lumbar: spine, thoracic: spine - 2 }, neck: spine + 3, head: spine + 4,
      legs: {
        near: { target: [X0, G - 13], foot: 0, side: [1, 0] },
        far: { a1: lerp(155, 186, p), a2: lerp(158, 176, p), foot: 172 },
      },
      arms: {
        near: { a1: arm, a2: arm - 2, hand: arm - 2 },
        far: { a1: arm + 1, a2: arm - 1, hand: arm - 1 },
      },
    };
  };
  return {
    id: 'barbell-single-leg-deadlift', name: '杠铃单腿硬拉', tl: hingeTL,
    meta: { en: 'Barbell Single-Leg Deadlift', family: 'hinge', equipment: ['barbell'], sources: ['hz:1756'] },
    muscles: [{ m: 'glutes', side: 'near' }, { m: 'hamstrings', side: 'near' }, { m: 'lowerBack', scale: 0.45 }],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    poster: 0.34,
    pose: (t) => pose(hingeTL.at(t).p),
  };
}

/** Seated hips stay over the bench while the trunk folds and unfolds under a rear-shoulder bar. */
export function seatedGoodMorning(): SideExercise {
  const bench = flatBench({ view: 'side', x: 222, top: 90, length: 170 });
  const pose = (p: number): Pose => {
    const a = lerp(-8, -91, p);
    return {
      hip: [218, G - 105], spine: { lumbar: a, thoracic: a - 2 }, neck: a + 3, head: a + 4,
      legs: {
        near: { a1: 0, a2: 90, foot: 0 },
        far: { a1: 0, a2: 90, foot: 0 },
      },
      arms: {
        near: { target: (J) => add(J.B(0.88), [-11, 3]), side: [0, -1], hand: 175 },
        far: { target: (J) => add(J.B(0.88), [-15, -2]), side: [0, -1], hand: 175 },
      },
    };
  };
  return {
    id: 'barbell-seated-good-morning', name: '杠铃坐姿早安式', tl: hingeTL,
    meta: { en: 'Barbell Seated Good Morning', family: 'hinge', equipment: ['barbell', 'bench'], sources: ['fe:Seated_Good_Mornings', 'hz:0090'] },
    muscles: [{ m: 'lowerBack' }, { m: 'glutes', scale: 0.55 }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: add(J.B(0.88), [-10, 0]) }) })],
    poster: 0.34,
    pose: (t) => pose(hingeTL.at(t).p),
  };
}

export const deficitPlatform = (h = 24): { floor: number; props: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => Props; box: [number, number] } => {
  const box = plyoBox({ x: X0, h, w: 152 });
  return { floor: G - h, props: (pal) => ({ back: box.draw(pal) }), box: box.box };
};

/** Both legs are shown in turn so a single-leg hinge reads as a bilateral exercise loop. */
export function alternatingSingleLegDeadlift(): SideExercise {
  const alternateTL = {
    total: hingeTL.total * 2,
    at: (t: number) => hingeTL.at(t < 0.5 ? t * 2 : (t - 0.5) * 2),
  };
  const working = (t: number): 'near' | 'far' => t < 0.5 ? 'near' : 'far';
  const pose = (p: number, side: 'near' | 'far'): Pose => {
    const hip: Vec2 = [lerp(258, 202, p), lerp(259, 298, p)];
    const spine = lerp(-90, -25, p);
    const arm = lerp(86, 101, p);
    const support = { target: [X0, G - 13] as Vec2, foot: 0, side: [1, 0] as Vec2 };
    const free = { a1: lerp(155, 186, p), a2: lerp(158, 176, p), foot: 172 };
    return {
      hip, spine: { lumbar: spine, thoracic: spine - 2 }, neck: spine + 3, head: spine + 4, farHip: 0,
      legs: side === 'near' ? { near: support, far: free } : { near: free, far: support },
      arms: {
        near: { a1: arm, a2: arm - 2, hand: arm - 2 },
        far: { a1: arm + 1, a2: arm - 1, hand: arm - 1 },
      },
    };
  };
  return {
    id: 'barbell-single-leg-deadlift', name: '杠铃单腿硬拉', tl: alternateTL,
    meta: { en: 'Barbell Single-Leg Deadlift', family: 'hinge', equipment: ['barbell'], sources: ['hz:1756'] },
    muscles: [
      { m: 'glutes', side: 'near', e: (t) => working(t) === 'near' ? alternateTL.at(t).e : alternateTL.at(t).e * 0.2 },
      { m: 'glutes', side: 'far', e: (t) => working(t) === 'far' ? alternateTL.at(t).e : alternateTL.at(t).e * 0.2 },
      { m: 'hamstrings', side: 'both', scale: 0.75 }, { m: 'lowerBack', scale: 0.4 },
    ],
    dynamic: [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    poster: 0.17,
    pose: (t) => pose(alternateTL.at(t).p, working(t)),
  };
}

const frontTL = timeline([
  { d: 1.2, from: 0, to: 1, e: [0.6, 1] },
  { d: 0.35, from: 1, to: 1, e: [1, 0.85] },
  { d: 1.55, from: 1, to: 0, e: [0.8, 0.45] },
  { d: 0.4, from: 0, to: 0, e: [0.35, 0.35] },
]);

type FrontDeadliftOptions = {
  id: string;
  name: string;
  en: string;
  sources: string[];
  sumo?: boolean;
  reverseBands?: boolean;
  snatchGrip?: boolean;
};

/** Front geometry makes the wide stance and wide snatch grip visible without misrepresenting the sagittal hinge. */
export function frontDeadlift(opts: FrontDeadliftOptions): FrontExercise {
  const stance = opts.sumo ? 42 : 25;
  const grip = opts.snatchGrip ? 58 : 44;
  const armTarget = (side: 'l' | 'r', p: number, _J: FrontJoints): [number, number, number] => {
    const sign = side === 'l' ? 1 : -1;
    // The front rig cannot show a literal floor bar and preserve a safe two-bone arm reach.
    // This low bar remains below the knees, while the side animations show the true floor setup.
    const low: [number, number, number] = [sign * grip, 108, 20];
    const top: [number, number, number] = [sign * grip, 200, 15];
    return [lerp(low[0], top[0], p), lerp(low[1], top[1], p), lerp(low[2], top[2], p)];
  };
  const pose = (p: number): FrontPose => {
    const bend = 1 - p;
    const pelvisY = lerp(195, 150, bend);
    const pitch = lerp(4, opts.sumo ? 52 : 60, bend);
    return {
      pelvis: [0, pelvisY, 0], hips: { pitch }, spine: { pitch: lerp(-2, 12, bend) }, neck: { pitch: lerp(-2, -7, bend) }, head: { pitch: lerp(-2, -7, bend) },
      legs: {
        l: { target: [stance, 13, 8], pole: [1, 25, 54], dir: toeDir([1, 0, 1]) },
        r: { target: [-stance, 13, 8], pole: [-1, 25, 54], dir: toeDir([-1, 0, 1]) },
      },
      arms: {
        l: { target: (J) => armTarget('l', p, J), pole: [1, 0, -1] },
        r: { target: (J) => armTarget('r', p, J), pole: [-1, 0, -1] },
      },
    };
  };
  const bandEnd = (J: FrontJoints): Vec2 => {
    const l = frontGripAt(J, 'l'), r = frontGripAt(J, 'r');
    return [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2];
  };
  return {
    id: opts.id, name: opts.name, view: 'front', tl: frontTL,
    meta: { en: opts.en, family: 'hinge', equipment: opts.reverseBands ? ['barbell', 'band'] : ['barbell'], sources: opts.sources },
    muscles: [
      { m: 'quads', side: 'both', scale: 0.7 }, { m: 'adductors', side: 'both', scale: opts.sumo ? 0.65 : 0.3 },
      { m: 'forearms', side: 'both', scale: 0.35 }, { m: 'traps', scale: 0.35 },
      { m: 'glutes', region: { view: 'front', part: 'pelvis', c: [16, 2], s: [20, 24], mirror: true }, scale: 0.85 },
      { m: 'hamstrings', region: { view: 'front', part: 'thigh', c: [0, 52], s: [18, 52] }, side: 'both', scale: 0.8 },
      { m: 'lowerBack', region: { view: 'front', part: 'lats', c: [0, 6], s: [14, 34] }, scale: 0.5 },
    ],
    props: opts.reverseBands ? (pal) => ({ back: [
      { kind: 'box', nm: 'rack-left', color: pal.prop, c: [112, 225], s: [14, 388], r: 4 },
      { kind: 'box', nm: 'rack-right', color: pal.prop, c: [400, 225], s: [14, 388], r: 4 },
      { kind: 'box', nm: 'rack-top', color: pal.prop, c: [256, 37], s: [302, 14], r: 4 },
      { kind: 'oval', nm: 'left-band-peg', color: pal.metal, c: [142, 55], s: [15, 15] },
      { kind: 'oval', nm: 'right-band-peg', color: pal.metal, c: [370, 55], s: [15, 15] },
    ] }) : undefined,
    propsBox: opts.reverseBands ? [96, 416] : undefined,
    dynamic: [
      barbell<FrontJoints>({ view: 'front', plate: 'medium', at: (J) => ({ p: bandEnd(J) }) }),
      ...(opts.reverseBands ? [
        bandCurve<FrontJoints>((J) => [[142, 55], [158, 133], [bandEnd(J)[0] - 35, bandEnd(J)[1] - 22], bandEnd(J)], 'underNearArm', 'Left reverse band'),
        bandCurve<FrontJoints>((J) => [[370, 55], [354, 133], [bandEnd(J)[0] + 35, bandEnd(J)[1] - 22], bandEnd(J)], 'underNearArm', 'Right reverse band'),
      ] : []),
    ],
    poster: 0.34,
    pose: (t) => pose(frontTL.at(t).p),
  };
}
