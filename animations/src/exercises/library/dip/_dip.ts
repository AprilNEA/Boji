// Shared side-view builders for dip catalog items.
// Each builder fixes the support points first: hands stay on their bar, bench, ball, or handles.
// The body moves vertically through elbow flexion while feet, bench pads, and machine contacts stay credible.
import type { LibraryMeta, SideExercise } from '@/exercise.ts';
import { add, lerp, sub, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import type { Joints, LimbPair, Pose } from '@/rig/side.ts';
import { ARM_STRAIGHT, G, GRIP_IN_HAND, handOnHip, hipForShoulder, standLegs } from '@/exercises/common.ts';
import { BALL, baseRail, dipBars, flatBench, pad, pullUpBar, seatPad, stabilityBall, tube, weightStack, workTL } from '@/exercises/equipment/index.ts';

type Catalog = { id: string; name: string; en: string; equipment: LibraryMeta['equipment']; sources: string[] };
type DipKind = 'regular' | 'chest' | 'triceps';

const catalog = (x: Catalog): LibraryMeta => ({ en: x.en, family: 'dip', equipment: x.equipment, sources: x.sources });
const span = (dx: number): number => Math.sqrt(ARM_STRAIGHT * ARM_STRAIGHT - dx * dx);

/** A rear-bench dip. The bench is behind the hips, the heels stay planted, and the upper arms reach roughly parallel. */
export function benchDip(x: Catalog, opts: { unilateral?: boolean; weighted?: boolean } = {}): SideExercise {
  // Each arm completes one controlled repetition before a single-arm set changes sides.
  const tl = opts.unilateral ? timeline([
    { d: 0.6, from: 0, to: 1, e: [0.35, 1] },
    { d: 0.2, from: 1, to: 1, e: [1, 0.9] },
    { d: 0.9, from: 1, to: 0, e: [0.9, 0.4] },
    { d: 0.2, from: 0, to: 0, e: [0.4, 0.3] },
    { d: 0.6, from: 0, to: 1, e: [0.35, 1] },
    { d: 0.2, from: 1, to: 1, e: [1, 0.9] },
    { d: 0.9, from: 1, to: 0, e: [0.9, 0.4] },
    { d: 0.2, from: 0, to: 0, e: [0.4, 0.3] },
  ]) : workTL(0.35);
  const rear = flatBench({ view: 'side', x: 120, length: 200 });
  const front = opts.weighted ? flatBench({ view: 'side', x: 430, length: 150, top: 97 }) : undefined;
  const wrist: Vec2 = [218, rear.seatY - GRIP_IN_HAND];
  const shoulderX = wrist[0] + 39;
  const shoulderY = wrist[1] - span(39);
  // The front bench supports fully extended legs in the weighted version.
  const footX = opts.weighted ? 438.5 : 405;
  const legs = (p: number): LimbPair => front
    ? {
      near: { target: [footX, front.seatY - 13], foot: 0, side: [0, -1] },
      far: { target: [footX, front.seatY - 13], foot: 0, side: [0, -1] },
    }
    : standLegs(footX, -5);
  const load = opts.weighted ? {
    nm: 'Lap dumbbell', kind: 'rigid' as const, z: 'front' as const,
    shapes: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => [
      { kind: 'box' as const, nm: 'dumbbell-handle', color: pal.metal, c: [0, 0] as Vec2, s: [44, 6] as Vec2, r: 3 },
      { kind: 'oval' as const, nm: 'dumbbell-plate-a', color: pal.plate, c: [-28, 0] as Vec2, s: [18, 42] as Vec2 },
      { kind: 'oval' as const, nm: 'dumbbell-plate-b', color: pal.plate, c: [28, 0] as Vec2, s: [18, 42] as Vec2 },
    ],
    at: (J: Joints) => ({ p: add(J.H, [45, 17]) as Vec2, a: 0 }),
  } : undefined;
  return {
    id: x.id, name: x.name, tl, meta: catalog(x),
    muscles: opts.unilateral
      ? [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.35 }, { m: 'delts', side: 'both', scale: 0.45 }]
      : [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.35 }, { m: 'delts', side: 'both', scale: 0.45 }],
    props: (pal) => ({ back: [...rear.draw(pal), ...(front?.draw(pal) ?? [])] }),
    propsBox: [rear.box[0], front?.box[1] ?? rear.box[1]],
    dynamic: load ? [load] : undefined,
    pose(t) {
      const p = tl.at(t).p;
      const activeNear = !opts.unilateral || t < 0.5;
      const spine = { lumbar: -90, thoracic: -90 };
      // A small forward hip path keeps the loaded legs long while both heels remain on the front bench.
      const S: Vec2 = [shoulderX + (opts.weighted ? 4 * p : 0), shoulderY + 40 * p];
      return {
        hip: hipForShoulder(S, spine), spine, neck: -90, head: -90, farHip: 0,
        legs: legs(p),
        arms: {
          near: activeNear ? { target: wrist, side: [-1, 0], hand: 90 } : handOnHip(0),
          far: opts.unilateral
            ? activeNear ? handOnHip(-4) : { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: 90 }
            : { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
        },
      };
    },
  } satisfies SideExercise;
}

const foldedLegs = (): LimbPair => ({
  // Knees bend behind the body and ankles overlap, as in a controlled supported dip.
  near: { a1: 95, a2: 150, foot: 150 },
  far: { a1: 96, a2: 151, foot: 151 },
});

/** A suspended dip with fixed hand grips. `chest` uses about 30° of forward torso lean. */
export function suspendedDip(
  x: Catalog,
  kind: DipKind,
  station: 'bars' | 'straight-bar' | 'rings' = 'bars',
): SideExercise {
  const tl = workTL(0.35);
  const wrist: Vec2 = [256, 216];
  const barY = wrist[1] + GRIP_IN_HAND;
  const lean = kind === 'chest' ? -60 : -90;
  const bars = station === 'bars' ? dipBars({ view: 'side', x: wrist[0], y: barY }) : undefined;
  const straight = station === 'straight-bar' ? pullUpBar({ view: 'side', x: wrist[0], y: barY }) : undefined;
  const ringBackProps = station === 'rings'
    ? (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => [
      { kind: 'box' as const, nm: 'ring-anchor', color: pal.metalDark, c: [wrist[0], 38] as Vec2, s: [72, 10] as Vec2, r: 4 },
      { kind: 'poly' as const, nm: 'ring-strap-near', color: pal.cable, pts: [[wrist[0] + 4, 42], [wrist[0], barY - 7]] as Vec2[], w: 4, closed: false },
      { kind: 'poly' as const, nm: 'ring-strap-far', color: pal.cable, pts: [[wrist[0] - 8, 42], [wrist[0] - 4, barY - 7]] as Vec2[], w: 4, closed: false },
    ] : undefined;
  const ringFrontProps = station === 'rings'
    ? (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => [
      { kind: 'ring' as const, nm: 'ring-near', color: pal.metal, c: [wrist[0], barY] as Vec2, s: [25, 25] as Vec2, w: 5 },
      { kind: 'ring' as const, nm: 'ring-far', color: pal.metalDark, c: [wrist[0] - 4, barY] as Vec2, s: [25, 25] as Vec2, w: 5 },
    ] : undefined;
  const topY = wrist[1] - ARM_STRAIGHT;
  return {
    id: x.id, name: x.name, tl, meta: catalog(x),
    muscles: kind === 'chest'
      ? [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.45 }]
      : [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.4 }],
    props: (pal) => station === 'rings'
      ? { back: ringBackProps!(pal), front: ringFrontProps!(pal) }
      : { back: (bars ?? straight)!.draw(pal) },
    propsBox: station === 'rings' ? [wrist[0] - 45, wrist[0] + 45] : (bars ?? straight)!.box,
    pose(t) {
      const p = tl.at(t).p;
      const spine = { lumbar: lean, thoracic: lean };
      const S: Vec2 = [wrist[0], topY + 40 * p];
      return {
        hip: hipForShoulder(S, spine), spine, neck: lean, head: lean, farHip: 0,
        legs: foldedLegs(),
        arms: {
          near: { target: wrist, side: [-1, 0], hand: 90 },
          far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Assisted kneeling dip. The counterweight platform follows the knees while the handles stay fixed. */
export function assistedMachineDip(x: Catalog, kind: DipKind): SideExercise {
  const tl = workTL(0.35);
  const wrist: Vec2 = [282, 220];
  const lean = kind === 'chest' ? -60 : -90;
  const stack = weightStack({ x: 128, top: 92, lift: (t) => 24 * tl.at(t).p });
  const platform = {
    nm: 'Assisted dip knee pad', kind: 'rigid' as const, z: 'back' as const,
    shapes: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => [
      { kind: 'box' as const, nm: 'knee-pad', color: pal.pad, c: [0, 0] as Vec2, s: [106, 18] as Vec2, r: 9 },
      { kind: 'box' as const, nm: 'knee-pad-post', color: pal.metalDark, c: [-28, 31] as Vec2, s: [11, 62] as Vec2, r: 3 },
    ],
    at: (J: Joints) => ({ p: add(J.knee_n, [4, 13]) as Vec2, a: 0 }),
  };
  return {
    id: x.id, name: x.name, tl, meta: catalog(x),
    muscles: kind === 'chest'
      ? [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.4 }]
      : [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.4 }, { m: 'delts', side: 'both', scale: 0.4 }],
    props: (pal) => ({ back: [
      ...stack.fixed(pal), baseRail(pal, 86, 334),
      tube(pal, 'machine-upright', [174, G - 5], [174, 102], { w: 16 }),
      tube(pal, 'machine-top', [174, 108], [286, 108], { w: 14 }),
      tube(pal, 'handle-rail', [250, wrist[1]], [306, wrist[1]], { dark: true, w: 10 }),
      pad(pal, 'machine-handle-grip', wrist, [46, 10]),
    ] }),
    propsBox: [stack.box[0], 338], dynamic: [stack.dynamic, platform],
    pose(t) {
      const p = tl.at(t).p;
      const spine = { lumbar: lean, thoracic: lean };
      const S: Vec2 = [wrist[0], wrist[1] - ARM_STRAIGHT + 40 * p];
      return {
        hip: hipForShoulder(S, spine), spine, neck: lean, head: lean, farHip: 0,
        legs: { near: { a1: 90, a2: 180, foot: 180 }, far: { a1: 91, a2: 180, foot: 180 } },
        arms: {
          near: { target: wrist, side: [-1, 0], hand: 90 },
          far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Seated selectorized dip. The torso and feet stay planted while the lever handles travel downward. */
export function seatedMachineDip(x: Catalog): SideExercise {
  const tl = workTL(0.35);
  const hip: Vec2 = [222, G - 117];
  const stack = weightStack({ x: 110, top: 88, lift: (t) => 25 * tl.at(t).p });
  // The 90° start and near-straight press both remain inside the 126 px arm reach.
  const handle = (p: number): Vec2 => [267, lerp(298, 342, p)];
  const upper = { hip, spine: { lumbar: -97, thoracic: -101 }, neck: -95, head: -92, farHip: 0 };
  return {
    id: x.id, name: x.name, tl, meta: catalog(x),
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.4 }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: [
      ...stack.fixed(pal), baseRail(pal, 68, 365),
      tube(pal, 'machine-main-post', [164, G - 5], [164, 156], { w: 16 }),
      tube(pal, 'machine-top-link', [164, 156], [284, 156], { w: 14 }),
      tube(pal, 'machine-seat-post', [230, G - 5], [230, 352], { dark: true, w: 15 }),
      pad(pal, 'machine-backrest', [184, 274], [20, 152]),
      seatPad(pal, 250, 352, 112),
    ] }),
    propsBox: [stack.box[0], 370],
    dynamic: [stack.dynamic, {
      nm: 'Seated dip lever', kind: 'rigid', z: 'underNearArm',
      shapes: (pal) => [
        { kind: 'box' as const, nm: 'lever-handle', color: pal.padFar, c: [0, 0] as Vec2, s: [42, 11] as Vec2, r: 5 },
        { kind: 'box' as const, nm: 'lever-link', color: pal.metal, c: [-24, -29] as Vec2, s: [10, 66] as Vec2, r: 4 },
      ],
      at: (J: Joints) => ({ p: J.wrist_n, a: 90 }),
    }],
    pose(t) {
      const p = tl.at(t).p;
      const grip = handle(p);
      return {
        ...upper,
        legs: { near: { a1: 8.6, a2: 90, foot: 0 }, far: { a1: 9.6, a2: 90, foot: 0 } },
        arms: {
          near: { target: grip, side: [-1, 0], hand: 90 },
          far: { target: (J) => add(grip, sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Stability-ball dip: hands keep the ball contact while the hips lift off its crown and return under control. */
export function stabilityBallDip(x: Catalog): SideExercise {
  const tl = workTL(0.35);
  const c: Vec2 = [257, G - BALL.r];
  // The hand center rests on the upper quadrant. The hips stay outside the rigid ball as the arms press.
  const wrist: Vec2 = [308, 329];
  return {
    id: x.id, name: x.name, tl, meta: catalog(x),
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.35 }, { m: 'delts', side: 'both', scale: 0.4 }],
    dynamic: [stabilityBall(() => ({ p: c }), 'back')], propsBox: [c[0] - BALL.r, c[0] + BALL.r],
    pose(t) {
      const p = tl.at(t).p;
      const spine = { lumbar: -90, thoracic: -90 };
      const S: Vec2 = [lerp(330, 315, p), lerp(244, 203.7, p)];
      return {
        hip: hipForShoulder(S, spine), spine, neck: -90, head: -90, farHip: 0,
        legs: standLegs(440, -5),
        arms: {
          near: { target: wrist, side: [-1, 0], hand: 90 },
          far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
        },
      };
    },
  } satisfies SideExercise;
}
