// Shared side-view press poses for the horizontal-press-3 work list.
// The flat-bench poses keep the upper back on the pad and both feet planted.
// The floor poses keep the spine on the floor and use a bent, planted support leg.
import type { EquipmentTag, SideExercise } from '@/exercise.ts';
import { add, ang, dir, len, lerp, mul, norm, sub, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { solve, type Joints, type LimbPair, type Pose } from '@/rig/side.ts';
import { A, FLOOR, G, standLegs } from '@/exercises/common.ts';
import {
  backrestAt, dumbbell, ezBar, flatBench, gobletDumbbell, gripAt, kettlebell, loadedPlates,
  barbell, declineBench, heldPlate, inclineBench, smithRails, weightStack, workTL,
} from '@/exercises/equipment/index.ts';

export type HorizontalPressKind =
  | 'dumbbell-bench'
  | 'two-hand-dumbbell-bench'
  | 'ez-bar-bench'
  | 'kettlebell-floor'
  | 'machine-seated'
  | 'machine-standing'
  | 'chain-bench'
  | 'svend-press'
  | 'smith-bench';

export interface HorizontalPressConfig {
  id: string;
  name: string;
  en: string;
  equipment: EquipmentTag[];
  sources: string[];
  kind: HorizontalPressKind;
  twist?: boolean;
  floorMode?: 'alternating' | 'extended-range' | 'single-arm' | 'leg-over';
  machinePath?: 'level' | 'decline' | 'incline';
  smithPosition?: 'flat' | 'decline' | 'incline' | 'standing';
  smithGrip?: 'close' | 'wide' | 'reverse' | 'standard';
}

const tl = workTL(0.3);
const flatBenchProp = flatBench({ view: 'side', x: 248 });
const FLAT_NECK: Vec2 = [146, flatBenchProp.seatY - 18];
const FLAT_HIP = add(FLAT_NECK, mul(dir(-3.8), 123.7));
const FLAT_SPINE = ang(sub(FLAT_NECK, FLAT_HIP));
const FLAT_LEGS: LimbPair = {
  near: { target: [FLAT_HIP[0] + 106, G - A], foot: 0, side: [0, -1] },
  far: { target: [FLAT_HIP[0] + 100, G - A], foot: 0, side: [0, -1] },
};
const flatBase = {
  hip: FLAT_HIP,
  spine: { lumbar: FLAT_SPINE, thoracic: FLAT_SPINE },
  neck: 182,
  head: 181,
  legs: FLAT_LEGS,
};

const FLOOR_NECK: Vec2 = [140, FLOOR - 18];
const FLOOR_HIP = add(FLOOR_NECK, mul(dir(-3.8), 123.7));
const FLOOR_SPINE = ang(sub(FLOOR_NECK, FLOOR_HIP));
const FLOOR_LEGS: LimbPair = {
  near: { target: [FLOOR_HIP[0] + 106, G - A], foot: 0, side: [0, -1] },
  far: { target: [FLOOR_HIP[0] + 100, G - A], foot: 0, side: [0, -1] },
};
const floorBase = {
  hip: FLOOR_HIP,
  spine: { lumbar: FLOOR_SPINE, thoracic: FLOOR_SPINE },
  neck: 182,
  head: 181,
};

/** Wrist path for a bench press: the bar stays above the lower chest and rises to a soft lockout. */
function benchWrist(J: Joints, p: number): Vec2 {
  return add(J.S, [40, lerp(-80, -119, p)]);
}

function benchArms(p: number, hand: number): Pose['arms'] {
  return {
    near: { target: (J) => benchWrist(J, p), side: [1, 0], hand },
    far: {
      target: (J) => add(benchWrist(J, p), sub(J.Sf, J.S)),
      side: [1, 0],
      hand,
    },
  };
}

function regularBenchPose(p: number, hand: number): Pose {
  return { ...flatBase, arms: benchArms(p, hand) };
}

/** Floor-press wrist path: the upper arm ends at the floor-side position, then the elbow reaches a true vertical lockout. */
function floorWrist(J: Joints, p: number, extendedRange = false): Vec2 {
  const x = extendedRange ? lerp(48, 10, p) : lerp(48, 40, p);
  const topY = extendedRange ? -126 : -119;
  return add(J.S, [x, lerp(-75, topY, p)]);
}

function floorArms(pNear: number, pFar: number, mode: NonNullable<HorizontalPressConfig['floorMode']>): Pose['arms'] {
  const near = (J: Joints) => floorWrist(J, pNear, mode === 'extended-range');
  const far = (J: Joints) => add(floorWrist(J, pFar), sub(J.Sf, J.S));
  if (mode === 'alternating') {
    return {
      near: { target: near, side: [1, 0], hand: -90 },
      far: { target: far, side: [1, 0], hand: -90 },
    };
  }
  return {
    near: { target: near, side: [1, 0], hand: -90 },
    // The unloaded arm rests out to the side, ready to stabilize the torso when needed.
    far: { a1: 174, a2: 178, hand: 178 },
  };
}

function floorLegs(mode: NonNullable<HorizontalPressConfig['floorMode']>): LimbPair {
  if (mode === 'extended-range') {
    return {
      // The pressing-side knee is folded across the body for the extra adduction range.
      near: { a1: -50, a2: 145, foot: 145 },
      far: FLOOR_LEGS.far,
    };
  }
  if (mode === 'leg-over') {
    return {
      // The working-side ankle rests across the opposite thigh instead of returning to the floor.
      near: { a1: -30, a2: 160, foot: 160 },
      far: FLOOR_LEGS.far,
    };
  }
  return FLOOR_LEGS;
}

function floorPose(pNear: number, pFar: number, mode: NonNullable<HorizontalPressConfig['floorMode']>): Pose {
  return { ...floorBase, legs: floorLegs(mode), arms: floorArms(pNear, pFar, mode) };
}

/** Center a lever pivot above the chord between its bottom and lockout hand positions. */
function leverPivot(start: Vec2, end: Vec2, rise: number): Vec2 {
  const chord = sub(end, start);
  const midpoint = mul(add(start, end), 0.5);
  return add(midpoint, mul(norm([chord[1], -chord[0]]), rise));
}

function dumbbellBench(c: HorizontalPressConfig): SideExercise {
  return {
    id: c.id,
    name: c.name,
    tl,
    meta: { en: c.en, family: 'horizontal-press', equipment: c.equipment, sources: c.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.65 }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: flatBenchProp.draw(pal) }),
    propsBox: flatBenchProp.box,
    dynamic: [dumbbell('f', 'profile'), dumbbell('n', 'profile')],
    pose: (t) => {
      const p = tl.at(t).p;
      // Neutral at the bottom, pronated at lockout. The profile dumbbells make the wrist rotation visible.
      return regularBenchPose(p, c.twist ? lerp(0, -90, p) : -90);
    },
  };
}

function twoHandDumbbellBench(c: HorizontalPressConfig): SideExercise {
  const neck: Vec2 = [150, flatBenchProp.seatY - 18];
  const hip: Vec2 = [247, G - 60];
  const legs: LimbPair = {
    near: { target: [350, G - A], foot: 0, side: [0, -1] },
    far: { target: [344, G - A], foot: 0, side: [0, -1] },
  };
  const wrist = (J: Joints, p: number): Vec2 => add(J.S, [40, lerp(-67, -119, p)]);
  return {
    id: c.id,
    name: c.name,
    tl,
    meta: { en: c.en, family: 'horizontal-press', equipment: c.equipment, sources: c.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: flatBenchProp.draw(pal) }),
    propsBox: flatBenchProp.box,
    dynamic: [gobletDumbbell()],
    pose: (t) => {
      const p = tl.at(t).p;
      return {
        hip,
        // Shoulders stay on the bench while the hips remain below it.
        spine: { target: neck, side: [0, 1] },
        neck: 202,
        head: 202,
        legs,
        arms: {
          near: { target: (J) => wrist(J, p), side: [1, 0], hand: -90 },
          far: { target: (J) => add(wrist(J, p), sub(J.Sf, J.S)), side: [1, 0], hand: -90 },
        },
      };
    },
  };
}

function ezBarBench(c: HorizontalPressConfig): SideExercise {
  return {
    id: c.id,
    name: c.name,
    tl,
    meta: { en: c.en, family: 'horizontal-press', equipment: c.equipment, sources: c.sources },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: flatBenchProp.draw(pal) }),
    propsBox: flatBenchProp.box,
    dynamic: [ezBar({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t) => regularBenchPose(tl.at(t).p, -90),
  };
}

function kettlebellFloor(c: HorizontalPressConfig): SideExercise {
  const mode = c.floorMode ?? 'single-arm';
  const alternating = mode === 'alternating';
  const alternatingTL = timeline([
    { d: 1.0, from: 0, to: 1, e: [0.45, 1] },
    { d: 0.25, from: 1, to: 1, e: [1, 0.9] },
    { d: 1.6, from: 1, to: 0, e: [0.85, 0.45] },
    { d: 0.25, from: 0, to: 0, e: [0.45, 0.45] },
  ]);
  const activeTL = alternating ? alternatingTL : tl;
  return {
    id: c.id,
    name: c.name,
    tl: activeTL,
    meta: { en: c.en, family: 'horizontal-press', equipment: c.equipment, sources: c.sources },
    muscles: [
      { m: 'pecs' }, { m: 'triceps', side: alternating ? 'both' : 'near', scale: 0.65 },
      { m: 'delts', side: alternating ? 'both' : 'near', scale: 0.3 }, { m: 'abs', scale: 0.3 },
    ],
    mat: true,
    dynamic: alternating
      ? [
        kettlebell((J) => ({ p: gripAt(J, 'f') }), 'edge', 'overFarArm', 'Far Kettlebell'),
        kettlebell((J) => ({ p: gripAt(J, 'n') }), 'edge', 'front', 'Near Kettlebell'),
      ]
      : [kettlebell((J) => ({ p: gripAt(J, 'n') }), 'edge', 'front')],
    pose: (t) => {
      const p = activeTL.at(t).p;
      // In the alternating version one bell reaches lockout as the other reaches the floor-side bottom.
      return floorPose(alternating ? 1 - p : p, alternating ? p : 0, mode);
    },
  };
}

/** Lever path and machine frame for a seated press. Handle height distinguishes chest, decline and incline presses. */
function machineSeated(c: HorizontalPressConfig): SideExercise {
  const path = c.machinePath ?? 'level';
  const hip: Vec2 = [226, G - 104];
  const legs: LimbPair = {
    near: { target: [326, G - A], foot: 0, side: [0, -1] },
    far: { target: [320, G - A], foot: 0, side: [0, -1] },
  };
  const base = { hip, spine: { lumbar: -99, thoracic: -101 }, neck: -93, head: -91, legs };
  const probe = solve({ ...base, arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } } });
  const [bottomOff, topOff]: [Vec2, Vec2] = path === 'incline'
    ? [[90, 35], [119, -59]]
    : path === 'decline'
      ? [[76, 58], [116, 65]]
      : [[83, 50], [134, 0]];
  // The handle sits 8 px beyond the wrist. The wrist is 90 px from the shoulder at the bottom and reaches 126 px at lockout.
  const start = add(probe.S, bottomOff);
  const end = add(probe.S, topOff);
  const pivot = leverPivot(start, end, 188);
  const radius = len(sub(start, pivot));
  const a0 = ang(sub(start, pivot));
  const a1 = ang(sub(end, pivot));
  const rest = backrestAt(probe, 0.55);
  const columnX = rest.c[0] - 42;
  const stack = weightStack({ x: columnX - 46, top: pivot[1] - 8, lift: (t) => 30 * tl.at(t).p });
  const grip = (p: number): Vec2 => add(pivot, mul(dir(lerp(a0, a1, p)), radius));
  return {
    id: c.id,
    name: c.name,
    tl,
    meta: { en: c.en, family: 'horizontal-press', equipment: c.equipment, sources: c.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.65 }, { m: 'delts', side: 'both', scale: 0.4 }],
    props: (pal) => ({
      back: [
        ...stack.fixed(pal),
        { kind: 'box', nm: 'machine-base', color: pal.metalDark, c: [(columnX + hip[0] + 78) / 2, G - 5], s: [hip[0] + 78 - columnX, 10], r: 3 },
        { kind: 'box', nm: 'machine-column', color: pal.metal, c: [columnX, (pivot[1] + G) / 2], s: [18, G - pivot[1] + 14], r: 4 },
        { kind: 'box', nm: 'machine-top-beam', color: pal.metal, c: [(columnX + pivot[0]) / 2, pivot[1]], s: [pivot[0] - columnX + 18, 16], r: 8 },
        { kind: 'box', nm: 'backrest-arm', color: pal.metalDark, c: [(columnX + rest.c[0]) / 2, rest.c[1]], s: [rest.c[0] - columnX, 10], r: 3 },
        { kind: 'box', nm: 'seat-post', color: pal.metalDark, c: [hip[0] + 6, G - 46], s: [14, 84], r: 3 },
        { kind: 'box', nm: 'seat-arm', color: pal.metalDark, c: [(columnX + hip[0]) / 2, G - 60], s: [hip[0] - columnX, 10], r: 3 },
        { kind: 'box', nm: 'backrest', color: pal.pad, c: rest.c, s: rest.size, r: 9, rot: rest.rot },
        { kind: 'box', nm: 'seat', color: pal.pad, c: [hip[0] + 10, G - 79], s: [94, 16], r: 8 },
        { kind: 'oval', nm: 'lever-pivot', color: pal.metalDark, c: pivot, s: [24, 24] },
      ],
    }),
    propsBox: [stack.box[0], hip[0] + 140],
    dynamic: [
      stack.dynamic,
      {
        nm: 'Plate-loaded Press Lever', z: 'back', kind: 'rigid',
        shapes: (pal) => [
          { kind: 'box', nm: 'lever', color: pal.metal, c: [0, radius / 2], s: [12, radius], r: 6 },
          { kind: 'box', nm: 'grip', color: pal.padFar, c: [0, radius + 2], s: [10, 36], r: 5 },
          ...loadedPlates(pal, [0, radius * 0.52], 90, 'medium', 2),
          { kind: 'oval', nm: 'lever-hub', color: pal.metalDark, c: [0, 0], s: [18, 18] },
        ],
        at: (_J, t) => ({ p: pivot, a: lerp(a0, a1, tl.at(t).p) - 90 }),
      },
    ],
    pose: (t) => {
      const g = grip(tl.at(t).p);
      return {
        ...base,
        arms: {
          near: { target: add(g, [-8, 0]), side: [-0.25, 1], hand: 0 },
          far: { target: (J) => add(add(g, [-8, 0]), sub(J.Sf, J.S)), side: [-0.25, 1], hand: 0 },
        },
      };
    },
  };
}

/** Standing lever press: planted feet and an upright torso stay fixed while the handles travel forward. */
function machineStanding(c: HorizontalPressConfig): SideExercise {
  const hip: Vec2 = [236, G - 184];
  const base = {
    hip,
    spine: { lumbar: -90, thoracic: -90 },
    neck: -90,
    head: -90,
    legs: standLegs(240, -6),
  };
  const probe = solve({ ...base, arms: { near: { a1: 0, a2: 0 }, far: { a1: 0, a2: 0 } } });
  const start = add(probe.S, [84, 30]);
  const end = add(probe.S, [132, 20]);
  const pivot = leverPivot(start, end, 176);
  const radius = len(sub(start, pivot));
  const a0 = ang(sub(start, pivot));
  const a1 = ang(sub(end, pivot));
  const columnX = pivot[0] - 104;
  const stack = weightStack({ x: columnX, top: pivot[1] - 12, lift: (t) => 30 * tl.at(t).p });
  const grip = (p: number): Vec2 => add(pivot, mul(dir(lerp(a0, a1, p)), radius));
  return {
    id: c.id,
    name: c.name,
    tl,
    meta: { en: c.en, family: 'horizontal-press', equipment: c.equipment, sources: c.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.65 }, { m: 'delts', side: 'both', scale: 0.4 }, { m: 'abs', scale: 0.3 }],
    props: (pal) => ({
      back: [
        ...stack.fixed(pal),
        { kind: 'box', nm: 'machine-base', color: pal.metalDark, c: [(columnX + hip[0] + 96) / 2, G - 5], s: [hip[0] + 96 - columnX, 10], r: 3 },
        { kind: 'box', nm: 'machine-column', color: pal.metal, c: [columnX + 62, (pivot[1] + G) / 2], s: [18, G - pivot[1] + 14], r: 4 },
        { kind: 'box', nm: 'machine-top-beam', color: pal.metal, c: [(columnX + 62 + pivot[0]) / 2, pivot[1]], s: [pivot[0] - columnX - 44, 16], r: 8 },
        { kind: 'oval', nm: 'lever-pivot', color: pal.metalDark, c: pivot, s: [24, 24] },
      ],
    }),
    propsBox: [stack.box[0], hip[0] + 140],
    dynamic: [
      stack.dynamic,
      {
        nm: 'Standing Press Lever', z: 'back', kind: 'rigid',
        shapes: (pal) => [
          { kind: 'box', nm: 'lever', color: pal.metal, c: [0, radius / 2], s: [12, radius], r: 6 },
          { kind: 'box', nm: 'grip', color: pal.padFar, c: [0, radius + 2], s: [10, 36], r: 5 },
          ...loadedPlates(pal, [0, radius * 0.5], 90, 'medium', 2),
          { kind: 'oval', nm: 'lever-hub', color: pal.metalDark, c: [0, 0], s: [18, 18] },
        ],
        at: (_J, t) => ({ p: pivot, a: lerp(a0, a1, tl.at(t).p) - 90 }),
      },
    ],
    pose: (t) => {
      const g = grip(tl.at(t).p);
      return {
        ...base,
        arms: {
          near: { target: add(g, [-8, 0]), side: [-0.25, 1], hand: 0 },
          far: { target: (J) => add(add(g, [-8, 0]), sub(J.Sf, J.S)), side: [-0.25, 1], hand: 0 },
        },
      };
    },
  };
}

/** Chain press: each handle is tethered to a chain that lays farther along the floor at the bottom. */
function chainBench(c: HorizontalPressConfig): SideExercise {
  const handle = (side: 'n' | 'f') => ({
    nm: `${side === 'n' ? 'Near' : 'Far'} Chain Handle`, z: side === 'n' ? 'front' as const : 'overFarArm' as const,
    kind: 'rigid' as const,
    shapes: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => [
      { kind: 'box' as const, nm: 'handle', color: pal.metalDark, c: [0, 0] as Vec2, s: [24, 8] as Vec2, r: 4 },
    ],
    at: (J: Joints) => ({ p: gripAt(J, side) }),
  });
  const chain = (side: 'n' | 'f') => ({
    nm: `${side === 'n' ? 'Near' : 'Far'} Chain`, kind: 'curve' as const, z: side === 'n' ? 'front' as const : 'overFarArm' as const,
    width: 4,
    color: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => pal.metalDark,
    at: (J: Joints, t: number): Vec2[] => {
      const p = tl.at(t).p;
      const g = gripAt(J, side);
      const dx = side === 'n' ? 1 : -1;
      // At the bottom, more chain has unloaded onto the floor beside the bench.
      return [g, add(g, [dx * 6, 45]), [g[0] + dx * 10, G - 9], [g[0] + dx * (20 + 34 * (1 - p)), G - 9]];
    },
  });
  return {
    id: c.id,
    name: c.name,
    tl,
    meta: { en: c.en, family: 'horizontal-press', equipment: c.equipment, sources: c.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.65 }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: flatBenchProp.draw(pal) }),
    propsBox: flatBenchProp.box,
    dynamic: [chain('f'), handle('f'), chain('n'), handle('n')],
    pose: (t) => regularBenchPose(tl.at(t).p, -90),
  };
}

/** Svend press: two palms squeeze a plate stack while the arms travel straight forward from the chest. */
function svendPress(c: HorizontalPressConfig): SideExercise {
  const hip: Vec2 = [236, G - 184];
  const base = {
    hip,
    spine: { lumbar: -90, thoracic: -90 },
    neck: -90,
    head: -90,
    legs: standLegs(240, -6),
  };
  const wrist = (J: Joints, p: number): Vec2 => add(J.S, [lerp(70, 117, p), lerp(50, 45, p)]);
  return {
    id: c.id,
    name: c.name,
    tl,
    meta: { en: c.en, family: 'horizontal-press', equipment: c.equipment, sources: c.sources },
    muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both', scale: 0.5 }, { m: 'forearms', side: 'both', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.3 }],
    dynamic: [heldPlate((J) => ({ p: gripAt(J, 'n') }), 'face', 'medium', 'front', 'Squeezed Plate Stack')],
    pose: (t) => {
      const p = tl.at(t).p;
      return {
        ...base,
        arms: {
          near: { target: (J) => wrist(J, p), side: [0, 1], hand: 0 },
          far: { target: (J) => add(wrist(J, p), sub(J.Sf, J.S)), side: [0, 1], hand: 0 },
        },
      };
    },
  };
}

type SmithBase = Omit<Pose, 'arms'>;

/** Build a Smith press from a fixed bench position. The bar remains on one vertical rail and the hands stay on it. */
function smithFromPose(
  c: HorizontalPressConfig,
  base: SmithBase,
  wrist: (J: Joints, p: number) => Vec2,
  bench: { draw: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => ReturnType<NonNullable<SideExercise['props']>>['back']; box: [number, number] } | null,
): SideExercise {
  const hand = c.smithGrip === 'reverse' ? 90 : -90;
  const poseAt = (p: number): Pose => ({
    ...base,
    arms: {
      near: { target: (J) => wrist(J, p), side: [1, 0], hand },
      far: { target: (J) => add(wrist(J, p), sub(J.Sf, J.S)), side: [1, 0], hand },
    },
  });
  const railX = gripAt(solve(poseAt(0)), 'n')[0];
  const rails = smithRails({ view: 'side', x: railX, top: 26 });
  const primary = c.smithGrip === 'close' ? 'triceps' as const : 'pecs' as const;
  return {
    id: c.id,
    name: c.name,
    tl,
    meta: { en: c.en, family: 'horizontal-press', equipment: c.equipment, sources: c.sources },
    muscles: [{ m: primary, side: primary === 'triceps' ? 'both' : undefined }, { m: primary === 'triceps' ? 'pecs' : 'triceps', side: 'both', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: [...(bench?.draw(pal) ?? []), ...rails.draw(pal)] }),
    propsBox: [Math.min(bench?.box[0] ?? rails.box[0], rails.box[0]), Math.max(bench?.box[1] ?? rails.box[1], rails.box[1])],
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }), nm: 'Smith Barbell' })],
    pose: (t) => poseAt(tl.at(t).p),
  };
}

function smithBench(c: HorizontalPressConfig): SideExercise {
  const position = c.smithPosition ?? 'flat';
  if (position === 'flat') {
    return smithFromPose(c, flatBase, (J, p) => add(J.S, [40, lerp(-80, -119, p)]), flatBenchProp);
  }
  if (position === 'incline') {
    const bench = inclineBench({ x: 278, angle: 35, facing: 1 });
    const hip = add(bench.hinge, mul(bench.normal, 22));
    const neck = add(hip, mul(bench.backDir, 123.7));
    const spine = ang(sub(neck, hip));
    const base: SmithBase = {
      hip,
      spine: { lumbar: spine, thoracic: spine },
      neck: spine,
      head: spine,
      legs: {
        near: { target: [hip[0] + 105, G - A], foot: 0, side: [0, -1] },
        far: { target: [hip[0] + 99, G - A], foot: 0, side: [0, -1] },
      },
    };
    return smithFromPose(c, base, (J, p) => add(J.S, [70, lerp(-55, -105, p)]), bench);
  }
  if (position === 'decline') {
    const bench = declineBench({ x: 112, angle: 20, low: 75, length: 225, facing: 1 });
    const neck = add(bench.head, mul(bench.normal, 18));
    const hip = add(neck, mul(dir(-20), 123.7));
    const spine = ang(sub(neck, hip));
    const base: SmithBase = {
      hip,
      spine: { lumbar: spine, thoracic: spine },
      neck: spine,
      head: spine,
      legs: {
        // Supine decline: the knees rise above the hip-to-roller line, toward the chest.
        near: { target: add(bench.roller, [-5, 17]), foot: -20, side: [0, -1] },
        far: { target: add(bench.roller, [-9, 18]), foot: -20, side: [0, -1] },
      },
    };
    return smithFromPose(c, base, (J, p) => add(J.S, [65, lerp(-55, -108, p)]), bench);
  }
  const hip: Vec2 = [236, G - 184];
  const base: SmithBase = {
    hip,
    spine: { lumbar: -90, thoracic: -90 },
    neck: -90,
    head: -90,
    legs: standLegs(240, -6),
  };
  return smithFromPose(c, base, (J, p) => add(J.S, [70, lerp(50, -105, p)]), null);
}

export function horizontalPress(c: HorizontalPressConfig): SideExercise {
  switch (c.kind) {
    case 'dumbbell-bench': return dumbbellBench(c);
    case 'two-hand-dumbbell-bench': return twoHandDumbbellBench(c);
    case 'ez-bar-bench': return ezBarBench(c);
    case 'kettlebell-floor': return kettlebellFloor(c);
    case 'machine-seated': return machineSeated(c);
    case 'machine-standing': return machineStanding(c);
    case 'chain-bench': return chainBench(c);
    case 'svend-press': return svendPress(c);
    case 'smith-bench': return smithBench(c);
  }
}
