// Shared, family-local row builders. Each keeps the torso and lower body fixed while the elbow retracts.
import type { LibraryMeta, PropShape, SideExercise } from '@/exercise.ts';
import { add, dir, lerp, lerpV, mul, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline, type Timeline } from '@/math/timeline.ts';
import { solve, type Joints, type LimbPair, type Pose } from '@/rig/side.ts';
import type { Palette } from '@/draw/palettes.ts';
import { A, G, FLOOR, handOnHip, standLegs, HIGH_PLANK } from '@/exercises/common.ts';
import { inclineBench } from '@/exercises/equipment/index.ts';

type HandleKind = 'rope' | 'v' | 'straight' | 'single';
type WeightKind = 'dumbbell' | 'kettlebell' | 'ez-bar';

interface Catalog {
  id: string;
  name: string;
  en: string;
  sources: string[];
  equipment: LibraryMeta['equipment'];
}

const ROW_TL = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.35, 1] },
  { d: 0.35, from: 1, to: 1, e: [1, 0.85] },
  { d: 1.55, from: 1, to: 0, e: [0.85, 0.4] },
  { d: 0.4, from: 0, to: 0, e: [0.4, 0.3] },
]);

const ALT_TOTAL = 4;
const pulse = (t: number): number => 0.5 - 0.5 * Math.cos(Math.PI * 2 * t);
const meta = (c: Catalog): LibraryMeta => ({ en: c.en, family: 'horizontal-row', equipment: c.equipment, sources: c.sources });
const grip = (J: Joints, s: 'n' | 'f' = 'n'): Vec2 => add(J[`wrist_${s}`], mul(dir(J[`hand_${s}`].a), 8));

function handleShapes(pal: Palette, kind: HandleKind, wide = false): PropShape[] {
  if (kind === 'rope') return [
    { kind: 'box', nm: 'rope-neck', color: pal.metalDark, c: [0, -8], s: [8, 16], r: 4 },
    { kind: 'box', nm: 'rope-left', color: pal.padFar, c: [-8, 7], s: [8, 27], r: 4, rot: -26 },
    { kind: 'box', nm: 'rope-right', color: pal.pad, c: [8, 7], s: [8, 27], r: 4, rot: 26 },
  ];
  if (kind === 'v') return [
    { kind: 'poly', nm: 'v-frame', color: pal.metalDark, pts: [[-13, 12], [0, -9], [13, 12]], w: 6, closed: false },
    { kind: 'box', nm: 'v-grip', color: pal.pad, c: [0, 13], s: [26, 8], r: 4 },
  ];
  if (kind === 'straight') return [
    { kind: 'box', nm: 'straight-bar', color: pal.metalDark, c: [0, 0], s: [wide ? 82 : 54, 8], r: 4 },
    { kind: 'box', nm: 'bar-grip', color: pal.padFar, c: [wide ? -27 : -14, 0], s: [15, 10], r: 4 },
    { kind: 'box', nm: 'bar-grip-near', color: pal.pad, c: [wide ? 27 : 14, 0], s: [15, 10], r: 4 },
  ];
  return [
    { kind: 'box', nm: 'single-handle', color: pal.metalDark, c: [0, 0], s: [9, 32], r: 4 },
    { kind: 'box', nm: 'single-grip', color: pal.pad, c: [0, 7], s: [12, 18], r: 5 },
  ];
}

function weightShapes(pal: Palette, kind: WeightKind): PropShape[] {
  if (kind === 'kettlebell') return [
    { kind: 'oval', nm: 'bell', color: pal.metalDark, c: [0, 12], s: [31, 30] },
    { kind: 'ring', nm: 'handle', color: pal.metal, c: [0, -2], s: [19, 22], w: 6 },
  ];
  if (kind === 'ez-bar') return [
    { kind: 'poly', nm: 'ez-bar', color: pal.metalDark, pts: [[-49, 0], [-31, -6], [-12, 5], [12, -5], [31, 6], [49, 0]], w: 7, closed: false },
    { kind: 'oval', nm: 'plate-far', color: pal.propDark, c: [-45, 0], s: [11, 29] },
    { kind: 'oval', nm: 'plate-near', color: pal.propDark, c: [45, 0], s: [11, 29] },
  ];
  return [
    { kind: 'box', nm: 'dumbbell-grip', color: pal.metalDark, c: [0, 0], s: [8, 30], r: 4 },
    { kind: 'oval', nm: 'dumbbell-top', color: pal.propDark, c: [0, -14], s: [25, 12] },
    { kind: 'oval', nm: 'dumbbell-bottom', color: pal.propDark, c: [0, 14], s: [25, 12] },
  ];
}

const seated = (() => {
  const hip: Vec2 = [158, G - 88];
  const ankle = add(hip, mul(dir(-3), 170));
  const legs: LimbPair = {
    near: { target: ankle, foot: -80, side: [0, -1] },
    far: { target: add(ankle, [-4, 1]), foot: -80, side: [0, -1] },
  };
  const torso = (p: number) => ({
    spine: { lumbar: lerp(-79, -89, p), thoracic: lerp(-81, -91, p) },
    neck: lerp(-82, -89, p), head: lerp(-86, -89, p), shoulderShift: lerp(-1, 3, p),
  });
  const probeArms = { near: { a1: 0, a2: 0 }, far: { a1: 0, a2: 0 } };
  const J0 = solve({ hip, legs, ...torso(0), arms: probeArms });
  const J1 = solve({ hip, legs, ...torso(1), arms: probeArms });
  const pulley: Vec2 = [390, G - 104];
  return { hip, ankle, legs, torso, J0, J1, pulley };
})();

function seatedProps(pal: Palette, elevated: boolean): { back: PropShape[] } {
  const seatY = seated.hip[1] + 24 - (elevated ? 26 : 0);
  return { back: [
    { kind: 'box', nm: 'machine-base', color: pal.metalDark, c: [250, G - 5], s: [330, 10], r: 4 },
    { kind: 'box', nm: 'seat-post', color: pal.metalDark, c: [160, (seatY + G) / 2], s: [13, G - seatY], r: 4 },
    { kind: 'box', nm: 'seat', color: pal.pad, c: [165, seatY], s: [115, 17], r: 8 },
    { kind: 'box', nm: 'footplate-post', color: pal.metalDark, c: [seated.ankle[0] + 28, (seated.ankle[1] + G) / 2], s: [13, G - seated.ankle[1] + 8], r: 4 },
    { kind: 'box', nm: 'footplate', color: pal.propDark, c: [seated.ankle[0] + 14, seated.ankle[1] - 10], s: [14, 72], r: 5, rot: 9 },
    { kind: 'box', nm: 'cable-column', color: pal.metal, c: [410, (72 + G) / 2], s: [22, G - 62], r: 6 },
    { kind: 'box', nm: 'top-arm', color: pal.metal, c: [401, 72], s: [44, 16], r: 7 },
    { kind: 'oval', nm: 'low-pulley', color: pal.metalDark, c: seated.pulley, s: [21, 21] },
    { kind: 'oval', nm: 'low-pulley-hub', color: pal.metal, c: seated.pulley, s: [7, 7] },
  ] };
}

export function seatedCableRow(c: Catalog & { handle: HandleKind; target?: 'abdomen' | 'chest'; elevated?: boolean; crossover?: boolean; alternating?: boolean; single?: boolean; rotate?: boolean; wide?: boolean }): SideExercise {
  const high = c.target === 'chest';
  // Raise the athlete with the elevated seat. Feet remain planted on the same footplate.
  const hip = add(seated.hip, c.elevated ? [0, -26] : [0, 0]);
  const legs: LimbPair = c.elevated ? {
    near: { target: seated.ankle, foot: -80, side: [0, -1] },
    far: { target: add(seated.ankle, [-4, 1]), foot: -80, side: [0, -1] },
  } : seated.legs;
  const handTarget = (J: Joints, p: number): Vec2 => {
    const start = add(J.S, mul(dir(12), 121));
    // End at 75–81° of elbow bend. A high row remains at the upper torso without collapsing the elbow.
    const end = add(J.B(high ? 0.55 : 0.42), mul(J.A(high ? 0.55 : 0.42), high ? 70 : 50));
    return lerpV(start, end, smooth(p));
  };
  const phase = (t: number) => c.alternating ? { near: pulse(t), far: pulse(t + 0.5) } : { near: ROW_TL.at(t).p, far: ROW_TL.at(t).p };
  const cableFrom = c.crossover ? [seated.pulley, [seated.pulley[0], seated.pulley[1] - 54] as Vec2] : [seated.pulley];
  return {
    id: c.id, name: c.name, tl: c.alternating ? { total: ALT_TOTAL } : ROW_TL, meta: meta(c),
    muscles: c.alternating ? [
      { m: 'upperBack', e: (t) => 0.25 + 0.75 * Math.max(pulse(t), pulse(t + 0.5)) },
      { m: 'biceps', side: 'both', scale: 0.55, e: (t) => 0.2 + 0.65 * Math.max(pulse(t), pulse(t + 0.5)) },
      { m: 'forearms', side: 'both', scale: 0.35, e: () => 0.45 },
    ] : [{ m: 'upperBack' }, { m: 'biceps', side: 'both', scale: 0.55 }, { m: 'forearms', side: 'both', scale: 0.35 }],
    props: (pal) => seatedProps(pal, c.elevated ?? false), propsBox: [86, 424],
    dynamic: [
      ...cableFrom.map((from, i) => ({
        nm: `Cable ${i + 1}`, z: 'back' as const, kind: 'line' as const, width: 2.8,
        color: (pal: Palette) => pal.cable,
        at: (J: Joints) => [from, grip(J, c.crossover && i === 0 ? 'f' : 'n')] as [Vec2, Vec2],
      })),
      {
        nm: c.handle === 'rope' ? 'Rope Handle' : c.handle === 'v' ? 'V Handle' : c.handle === 'straight' ? 'Straight Bar' : 'Single Handle',
        z: 'underNearArm', kind: 'rigid', shapes: (pal: Palette) => handleShapes(pal, c.handle, c.wide),
        at: (J: Joints) => ({ p: grip(J), a: c.handle === 'straight' ? 0 : J.hand_n.a - 90 }),
      },
    ],
    pose(t): Pose {
      const p = phase(t);
      const torsoP = c.alternating ? 0.45 : ROW_TL.at(t).p;
      const near = handTarget(solve({ hip, legs, ...seated.torso(torsoP), arms: { near: { a1: 0, a2: 0 }, far: { a1: 0, a2: 0 } } }), p.near);
      return {
        hip, legs, ...seated.torso(torsoP),
        arms: {
          near: { target: near, side: [-0.6, 1], hand: c.rotate ? lerp(0, 90, p.near) : c.handle === 'single' ? 0 : 4 },
          far: c.single ? handOnHip(-4) : { target: (J) => add(handTarget(J, p.far), [-5, -2]), side: [-0.6, 1], hand: c.rotate ? lerp(0, 90, p.far) : c.handle === 'single' ? 0 : 4 },
        },
      };
    },
  } satisfies SideExercise;
}

const hingeBase = {
  hip: [214, G - A - 169] as Vec2,
  spine: { lumbar: -17, thoracic: -19 }, neck: -20, head: -14,
  legs: standLegs(280, 0),
};

function hingeTarget(J: Joints, p: number, high = false): Vec2 {
  const start = add(J.S, [7, 123]);
  // Stop with a strong 70–80° elbow bend instead of pulling the load into the torso.
  const end = add(J.B(high ? 0.65 : 0.25), mul(J.A(high ? 0.65 : 0.25), high ? 20 : 20));
  return lerpV(start, end, smooth(p));
}

export function hingeRow(c: Catalog & { weight: WeightKind; single?: boolean; alternating?: boolean; cable?: boolean; handle?: HandleKind; high?: boolean; rotate?: boolean; reverse?: boolean }): SideExercise {
  const phase = (t: number) => c.alternating ? { near: pulse(t), far: pulse(t + 0.5) } : { near: ROW_TL.at(t).p, far: ROW_TL.at(t).p };
  const pulley: Vec2 = [402, G - 128];
  return {
    id: c.id, name: c.name, tl: c.alternating ? { total: ALT_TOTAL } : ROW_TL, meta: meta(c),
    muscles: c.alternating ? [
      { m: 'upperBack', e: (t) => 0.25 + 0.75 * Math.max(pulse(t), pulse(t + 0.5)) },
      { m: 'biceps', side: 'both', scale: 0.55, e: (t) => 0.2 + 0.65 * Math.max(pulse(t), pulse(t + 0.5)) },
      { m: 'forearms', side: 'both', scale: 0.35, e: () => 0.45 },
      { m: 'lowerBack', scale: 0.4, e: () => 0.55 },
    ] : [{ m: 'upperBack' }, { m: 'biceps', side: c.single ? 'near' : 'both', scale: 0.55 }, { m: 'forearms', side: c.single ? 'near' : 'both', scale: 0.35 }, { m: 'lowerBack', scale: 0.4 }],
    props: c.cable ? (pal) => ({ back: [
      { kind: 'box', nm: 'cable-base', color: pal.metalDark, c: [407, G - 5], s: [44, 10], r: 4 },
      { kind: 'box', nm: 'cable-column', color: pal.metal, c: [407, (92 + G) / 2], s: [22, G - 82], r: 6 },
      { kind: 'oval', nm: 'low-pulley', color: pal.metalDark, c: pulley, s: [21, 21] },
    ] }) : undefined,
    propsBox: c.cable ? [126, 424] : undefined,
    dynamic: [
      ...(c.cable ? [{ nm: 'Cable', z: 'back' as const, kind: 'line' as const, width: 2.8, color: (pal: Palette) => pal.cable, at: (J: Joints) => [pulley, grip(J)] as [Vec2, Vec2] }] : []),
      ...(c.cable || c.single || c.weight === 'ez-bar' ? [{ nm: c.cable ? 'Cable Handle' : c.weight, z: 'underNearArm' as const, kind: 'rigid' as const, shapes: (pal: Palette) => c.cable ? handleShapes(pal, c.handle ?? 'single') : weightShapes(pal, c.weight), at: (J: Joints, t: number) => ({ p: grip(J), a: c.rotate ? 75 * (c.alternating ? pulse(t) : ROW_TL.at(t).p) : c.reverse ? 180 : 0 }) }] : [
        { nm: c.weight, z: 'overFarArm' as const, kind: 'rigid' as const, shapes: (pal: Palette) => weightShapes(pal, c.weight), at: (J: Joints, t: number) => ({ p: grip(J, 'f'), a: c.rotate ? 75 * (c.alternating ? pulse(t + 0.5) : ROW_TL.at(t).p) : c.reverse ? 180 : 0 }) },
        { nm: c.weight, z: 'underNearArm' as const, kind: 'rigid' as const, shapes: (pal: Palette) => weightShapes(pal, c.weight), at: (J: Joints, t: number) => ({ p: grip(J), a: c.rotate ? 75 * (c.alternating ? pulse(t) : ROW_TL.at(t).p) : c.reverse ? 180 : 0 }) },
      ]),
    ],
    pose(t): Pose {
      const p = phase(t);
      return {
        ...hingeBase,
        arms: {
          near: { target: (J) => hingeTarget(J, p.near, c.high), side: [-1, 0], hand: c.rotate ? lerp(88, -2, p.near) : c.reverse ? -90 : 90 },
          far: c.single ? handOnHip(-5) : { target: (J) => add(hingeTarget(J, p.far, c.high), [-4, -2]), side: [-1, 0], hand: c.rotate ? lerp(90, 0, p.far) : c.reverse ? -90 : 90 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Upright standing cable rows: the knees stay soft but the hips and spine do not hinge. */
export function standingCableRow(c: Catalog & { handle: HandleKind; high?: boolean; single?: boolean; split?: boolean; rotate?: boolean }): SideExercise {
  const base = {
    // Centre the pelvis over the staggered feet. The former x=264 hip put the far ankle beyond the 184 px leg reach.
    hip: [260, G - A - 180] as Vec2,
    spine: { lumbar: -89, thoracic: -91 }, neck: -87, head: -88,
    legs: standLegs(270, c.split ? -50 : 0),
  };
  const pulley: Vec2 = [404, c.high ? G - 244 : G - 181];
  const target = (J: Joints, p: number): Vec2 => {
    const start = add(J.S, c.high ? [118, 12] : [112, 49]);
    const end = add(J.S, c.high ? [65, 30] : [60, 52]);
    return lerpV(start, end, smooth(p));
  };
  return {
    id: c.id, name: c.name, tl: ROW_TL, meta: meta(c),
    muscles: [{ m: 'upperBack' }, { m: 'biceps', side: c.single ? 'near' : 'both', scale: 0.55 }, { m: 'forearms', side: c.single ? 'near' : 'both', scale: 0.35 }, { m: 'delts', side: c.single ? 'near' : 'both', scale: 0.3 }],
    props: (pal) => ({ back: [
      { kind: 'box', nm: 'cable-base', color: pal.metalDark, c: [407, G - 5], s: [48, 10], r: 4 },
      { kind: 'box', nm: 'cable-column', color: pal.metal, c: [407, (72 + G) / 2], s: [22, G - 62], r: 6 },
      { kind: 'oval', nm: 'pulley', color: pal.metalDark, c: pulley, s: [22, 22] },
      { kind: 'oval', nm: 'pulley-hub', color: pal.metal, c: pulley, s: [8, 8] },
    ] }),
    propsBox: [210, 424],
    dynamic: [
      { nm: 'Cable', z: 'back', kind: 'line', width: 2.8, color: (pal: Palette) => pal.cable, at: (J: Joints) => [pulley, grip(J)] },
      { nm: 'Cable Handle', z: 'underNearArm', kind: 'rigid', shapes: (pal: Palette) => handleShapes(pal, c.handle), at: (J: Joints, t: number) => ({ p: grip(J), a: c.rotate ? 75 * ROW_TL.at(t).p : c.handle === 'straight' ? 0 : J.hand_n.a - 90 }) },
    ],
    pose(t): Pose {
      const p = ROW_TL.at(t).p;
      return {
        ...base,
        arms: {
          near: { target: (J) => target(J, p), side: [-0.7, 1], hand: c.rotate ? lerp(88, -2, p) : 0 },
          far: c.single ? handOnHip(-4) : { target: (J) => add(target(J, p), [-5, -2]), side: [-0.7, 1], hand: c.rotate ? lerp(90, 0, p) : 0 },
        },
      };
    },
  } satisfies SideExercise;
}

const incline = (() => {
  const hip: Vec2 = [230, G - A - 163];
  const base = {
    hip, spine: { lumbar: -50, thoracic: -52 }, neck: -53, head: -49,
    legs: {
      // The chest-supported athlete is prone. Each knee points forward while the feet stay behind the hips.
      near: { target: [178, G - A], foot: 0, side: [1, 0] },
      far: { target: [172, G - A], foot: 0, side: [1, 0] },
    } satisfies LimbPair,
  };
  const J = solve({ ...base, arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } } });
  return { ...base, J };
})();

// The backrest rises toward the prone athlete's head at screen right, parallel to the 50° torso and about 20 px in
// front of the spine line, so the chest rests on the pad. Same bench as inclineRow in _horizontal-row-1.ts.
const INCLINE_BENCH = inclineBench({ x: 220, top: 132, angle: 50, facing: -1, back: 165, seat: 72 });

function inclineProps(pal: Palette, cable: boolean): { back: PropShape[] } {
  const out: PropShape[] = [...INCLINE_BENCH.draw(pal)];
  if (cable) out.push(
    { kind: 'box', nm: 'cable-base', color: pal.metalDark, c: [415, G - 5], s: [40, 10], r: 4 },
    { kind: 'box', nm: 'cable-column', color: pal.metal, c: [415, (130 + G) / 2], s: [20, G - 120], r: 5 },
    { kind: 'oval', nm: 'low-pulley', color: pal.metalDark, c: [405, G - 122], s: [20, 20] },
  );
  return { back: out };
}

export function inclineRow(c: Catalog & { weight?: WeightKind; cable?: boolean; wide?: boolean; single?: boolean; reverse?: boolean }): SideExercise {
  const pulley: Vec2 = [405, G - 122];
  const target = (J: Joints, p: number): Vec2 => {
    const start = c.cable ? add(J.S, [84, 69]) : add(J.S, [2, 124]);
    // A chest-supported row finishes at 70–75° elbow bend, including the flared-elbow variation.
    const end = c.wide ? add(J.B(0.3), mul(J.A(0.3), 16)) : add(J.B(0.3), mul(J.A(0.3), 16));
    return lerpV(start, end, smooth(p));
  };
  return {
    id: c.id, name: c.name, tl: ROW_TL, meta: meta(c),
    muscles: [{ m: 'upperBack' }, { m: 'biceps', side: c.single ? 'near' : 'both', scale: 0.55 }, { m: 'delts', side: c.wide ? 'both' : 'near', scale: c.wide ? 0.55 : 0.3 }, { m: 'forearms', side: c.single ? 'near' : 'both', scale: 0.3 }],
    props: (pal) => inclineProps(pal, c.cable ?? false), propsBox: [INCLINE_BENCH.box[0], c.cable ? 430 : INCLINE_BENCH.box[1]],
    dynamic: [
      ...(c.cable ? [{ nm: 'Cable', z: 'back' as const, kind: 'line' as const, width: 2.8, color: (pal: Palette) => pal.cable, at: (J: Joints) => [pulley, grip(J)] as [Vec2, Vec2] }] : []),
      ...(c.single ? [{ nm: c.cable ? 'Rope Handle' : 'Dumbbell', z: 'underNearArm' as const, kind: 'rigid' as const, shapes: (pal: Palette) => c.cable ? handleShapes(pal, 'rope') : weightShapes(pal, 'dumbbell'), at: (J: Joints) => ({ p: grip(J), a: c.reverse ? 180 : 0 }) }] : [
        { nm: c.cable ? 'Rope Handle' : 'Far Dumbbell', z: 'overFarArm' as const, kind: 'rigid' as const, shapes: (pal: Palette) => c.cable ? handleShapes(pal, 'rope') : weightShapes(pal, c.weight ?? 'dumbbell'), at: (J: Joints) => ({ p: grip(J, 'f'), a: c.reverse ? 180 : 0 }) },
        { nm: c.cable ? 'Rope Handle' : 'Near Dumbbell', z: 'underNearArm' as const, kind: 'rigid' as const, shapes: (pal: Palette) => c.cable ? handleShapes(pal, 'rope') : weightShapes(pal, c.weight ?? 'dumbbell'), at: (J: Joints) => ({ p: grip(J), a: c.reverse ? 180 : 0 }) },
      ]),
    ],
    pose(t): Pose {
      const p = ROW_TL.at(t).p;
      return {
        ...incline,
        arms: {
          near: { target: (J) => target(J, p), side: c.wide ? [0, 1] : [-1, 0], hand: c.reverse ? 180 : 90 },
          far: c.single ? handOnHip(-8) : { target: (J) => add(target(J, p), [-4, -2]), side: c.wide ? [0, 1] : [-1, 0], hand: c.reverse ? 180 : 90 },
        },
      };
    },
  } satisfies SideExercise;
}

export function benchSupportedRow(c: Catalog & { reverse?: boolean; incline?: boolean }): SideExercise {
  const hip: Vec2 = [211, G - A - 165];
  const base = {
    hip, spine: { lumbar: -17, thoracic: -19 }, neck: -20, head: -14,
    legs: {
      near: { target: [280, G - A], foot: 0, side: [0, -1] },
      far: { a1: 35, a2: 90, foot: 0 },
    } satisfies LimbPair,
  };
  const target = (J: Joints, p: number) => lerpV(add(J.S, [8, 122]), add(J.B(0.3), mul(J.A(0.3), 16)), smooth(p));
  return {
    id: c.id, name: c.name, tl: ROW_TL, meta: meta(c),
    muscles: [{ m: 'upperBack' }, { m: 'lats' }, { m: 'biceps', side: 'near', scale: 0.55 }, { m: 'forearms', side: 'near', scale: 0.35 }, { m: 'lowerBack', scale: 0.35 }],
    props: (pal) => ({ back: [
      { kind: 'box', nm: 'bench-top', color: pal.pad, c: [288, 323], s: [150, 18], r: 8, rot: c.incline ? -45 : 0 },
      { kind: 'box', nm: 'bench-leg-left', color: pal.metalDark, c: [240, 386], s: [13, 125], r: 4 },
      { kind: 'box', nm: 'bench-leg-right', color: pal.metalDark, c: [334, 386], s: [13, 125], r: 4 },
      { kind: 'box', nm: 'bench-brace', color: pal.metal, c: [287, 397], s: [110, 9], r: 4 },
    ] }),
    propsBox: [132, 374],
    dynamic: [{ nm: 'Dumbbell', z: 'underNearArm', kind: 'rigid', shapes: (pal: Palette) => weightShapes(pal, 'dumbbell'), at: (J: Joints) => ({ p: grip(J), a: c.reverse ? 180 : 0 }) }],
    pose(t): Pose {
      const p = ROW_TL.at(t).p;
      return {
        ...base,
        arms: {
          near: { target: (J) => target(J, p), side: [-1, 0], hand: c.reverse ? 180 : 90 },
          far: { target: [300, 314], side: [-1, 0], hand: 0 },
        },
      };
    },
  } satisfies SideExercise;
}

export function renegadeKettlebellRow(c: Catalog): SideExercise {
  // A kettlebell handle is 20 px above a planted wrist. Raise the plank body as
  // well, so the supporting elbows stay long while the bell body rests on the mat.
  const handleN = add(HIGH_PLANK.wrist, [0, -20]);
  const handleF = add(HIGH_PLANK.wristFar, [0, -20]);
  const pull = (J: Joints, p: number, s: 'n' | 'f') => {
    const floor = s === 'n' ? handleN : handleF;
    const chest = add(J.B(0.3), mul(J.A(0.3), 27));
    return lerpV(floor, chest, smooth(p));
  };
  return {
    id: c.id, name: c.name, tl: { total: ALT_TOTAL }, mat: true, meta: meta(c),
    muscles: [
      { m: 'upperBack', e: (t) => 0.25 + 0.75 * Math.max(pulse(t), pulse(t + 0.5)) },
      { m: 'biceps', side: 'both', scale: 0.55, e: (t) => 0.2 + 0.65 * Math.max(pulse(t), pulse(t + 0.5)) },
      { m: 'abs', scale: 0.65, e: () => 0.7 }, { m: 'delts', side: 'both', scale: 0.35, e: () => 0.55 },
    ],
    dynamic: [
      { nm: 'Far Kettlebell', z: 'overFarArm', kind: 'rigid', shapes: (pal: Palette) => weightShapes(pal, 'kettlebell'), at: (J: Joints) => ({ p: grip(J, 'f'), a: 0 }) },
      { nm: 'Near Kettlebell', z: 'underNearArm', kind: 'rigid', shapes: (pal: Palette) => weightShapes(pal, 'kettlebell'), at: (J: Joints) => ({ p: grip(J), a: 0 }) },
    ],
    pose(t): Pose {
      const pn = pulse(t), pf = pulse(t + 0.5);
      return {
        ...HIGH_PLANK.body(HIGH_PLANK.top - 5),
        arms: {
          near: { target: (J) => pull(J, pn, 'n'), side: [-1, 0], hand: 0 },
          far: { target: (J) => pull(J, pf, 'f'), side: [-1, 0], hand: 0 },
        },
      };
    },
  } satisfies SideExercise;
}
