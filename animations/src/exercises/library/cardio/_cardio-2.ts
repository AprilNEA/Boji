// Private builders for cardio-2. Each pose keeps the machine contacts fixed or moves them on the correct crank or rail.
// The figures face right. Fast cardio loops repeat at the starting pose without a seam.
import type { SideExercise, PropShape } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { BODY, type Joints, type Pose } from '@/rig/side.ts';
import { A, G, GRIP_IN_HAND, standLegs } from '@/exercises/common.ts';
import { dumbbell } from '@/exercises/equipment/index.ts';

export type CardioMeta = Pick<NonNullable<SideExercise['meta']>, 'en' | 'sources'>;
const TAU = Math.PI * 2;
const loop = (total: number) => timeline([
  { d: total / 2, from: 0, to: 1, e: [0.45, 1] },
  { d: total / 2, from: 1, to: 0, e: [1, 0.45] },
]);
const cardioTL = loop(1.2);
const upright = (hip: Vec2): Omit<Pose, 'legs' | 'arms'> => ({
  hip, spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
});
const seated = (hip: Vec2, lean = -82): Omit<Pose, 'legs' | 'arms'> => ({
  hip, spine: { lumbar: lean, thoracic: lean }, neck: lean, head: lean,
});
const machineBase = (pal: { metal: string; metalDark: string; prop: string; propLight: string; pad: string; padFar: string }): PropShape[] => [
  { kind: 'box', nm: 'machine-base', color: pal.metalDark, c: [269, G - 4], s: [340, 10], r: 4 },
];
const treadmillProps = (pal: any, incline = 0): { back: PropShape[]; front: PropShape[] } => {
  const deckY = G - 22;
  return {
    back: [
      ...machineBase(pal),
      { kind: 'box', nm: 'treadmill-deck', color: pal.prop, c: [245, deckY], s: [315, 25], r: 8, rot: -incline },
      { kind: 'box', nm: 'treadmill-belt', color: pal.metalDark, c: [245, deckY - 3], s: [280, 9], r: 4, rot: -incline },
      { kind: 'box', nm: 'treadmill-upright', color: pal.metal, c: [389, 321], s: [13, 190], r: 5, rot: -incline },
      { kind: 'box', nm: 'treadmill-console-arm', color: pal.metal, c: [360, 231], s: [72, 10], r: 4, rot: -incline },
      { kind: 'box', nm: 'treadmill-console', color: pal.propLight, c: [329, 216], s: [55, 36], r: 5, rot: -incline },
      { kind: 'box', nm: 'treadmill-screen', color: pal.metalDark, c: [326, 214], s: [37, 19], r: 3, rot: -incline },
    ], front: [],
  };
};

/** Walking retains one contact. Jogging has a short swing. Running includes a brief flight phase. */
export function treadmill(meta: CardioMeta, name: string, speed: 'walk' | 'jog' | 'run' | 'incline'): SideExercise {
  const stride = speed === 'walk' || speed === 'incline' ? 28 : speed === 'jog' ? 39 : 49;
  const lift = speed === 'walk' || speed === 'incline' ? 13 : speed === 'jog' ? 27 : 39;
  const incline = speed === 'incline' ? 7 : 0;
  const flight = speed === 'run' ? 0.24 : speed === 'jog' ? 0.08 : 0;
  return {
    id: '', name, tl: cardioTL, poster: 0.25,
    meta: { ...meta, family: 'cardio', equipment: ['cardio-machine'] },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.55 }, { m: 'glutes', scale: 0.4 }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
    props: (pal) => treadmillProps(pal, incline), propsBox: [65, 455],
    pose(t) {
      const s = Math.sin(TAU * t), c = Math.cos(TAU * t);
      const step = (phase: number) => Math.max(0, phase);
      // A small knee flex keeps the longest stance stride inside the 184 px leg reach.
      const hip: Vec2 = [220, 270 - (speed === 'run' ? 3 : 0) + 2 * c];
      const ankle = (phase: number): Vec2 => [220 + stride * phase, G - A - lift * step(phase + flight) - incline * (0.5 + 0.5 * phase)];
      return {
        ...upright(hip),
        legs: { near: { target: ankle(s), foot: 0, side: [1, 0] }, far: { target: ankle(-s), foot: 0, side: [1, 0] } },
        arms: {
          near: { target: (J) => add(J.S, [-26 * c, 95 + 7 * Math.abs(c)]), side: [-1, 0] },
          far: { target: (J) => add(J.Sf, [26 * c, 95 + 7 * Math.abs(c)]), side: [-1, 0] },
        },
      };
    },
  };
}

const bikeProps = (pal: any, road = false, recumbent = false): { back: PropShape[]; front: PropShape[] } => {
  const y = recumbent ? 377 : 390;
  const wheel = (x: number, nm: string): PropShape[] => road ? [
    { kind: 'ring', nm: `${nm}-tire`, color: pal.metalDark, c: [x, y], s: [96, 96], w: 7 },
    { kind: 'ring', nm: `${nm}-rim`, color: pal.metal, c: [x, y], s: [76, 76], w: 2 },
    { kind: 'oval', nm: `${nm}-hub`, color: pal.metal, c: [x, y], s: [10, 10] },
  ] : [];
  const flywheel: PropShape[] = [
    ...machineBase(pal),
    { kind: 'oval', nm: 'flywheel', color: pal.metalDark, c: [310, y], s: [105, 105] },
    { kind: 'ring', nm: 'flywheel-rim', color: pal.metal, c: [310, y], s: [82, 82], w: 4 },
  ];
  return { back: [
    ...(road ? [...wheel(142, 'rear-wheel'), ...wheel(337, 'front-wheel')]
      : flywheel),
    { kind: 'box', nm: 'bike-frame-low', color: pal.metal, c: [242, 362], s: [145, 10], r: 4, rot: -22 },
    { kind: 'box', nm: 'bike-frame-high', color: pal.metal, c: [247, 322], s: [140, 10], r: 4, rot: 18 },
    { kind: 'box', nm: 'bike-seat-post', color: pal.metalDark, c: [190, 327], s: [10, 73], r: 4, rot: recumbent ? 0 : -10 },
    { kind: 'box', nm: 'bike-seat', color: pal.pad, c: [178, 300], s: recumbent ? [107, 22] : [63, 20], r: 9 },
    ...(recumbent ? [{ kind: 'box', nm: 'bike-backrest', color: pal.padFar, c: [124, 305], s: [23, 105], r: 10, rot: -10 } satisfies PropShape] : []),
    { kind: 'box', nm: 'bike-stem', color: pal.metal, c: [286, 283], s: [10, 116], r: 4, rot: -13 },
    { kind: 'box', nm: 'bike-handlebar', color: pal.metalDark, c: [267, 246], s: [66, 10], r: 5 },
  ], front: [] };
};

/** Pedals trace a circle. The seated rider holds a stable handlebar. */
export function bicycle(meta: CardioMeta, name: string, kind: 'stationary' | 'road' | 'recumbent'): SideExercise {
  const recumbent = kind === 'recumbent', road = kind === 'road';
  const hip: Vec2 = recumbent ? [170, 337] : [185, 319];
  const crank: Vec2 = recumbent ? [295, 374] : [290, 382];
  const radius = recumbent ? 39 : 43;
  return {
    id: '', name, tl: cardioTL, poster: 0.12,
    meta: { ...meta, family: 'cardio', equipment: [road ? 'other' : 'cardio-machine'] },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.5 }, { m: 'glutes', scale: 0.4 }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
    props: (pal) => bikeProps(pal, road, recumbent), propsBox: [65, 410],
    dynamic: [{ nm: 'Pedal Crank', z: 'back', kind: 'rigid', shapes: (pal) => [
      { kind: 'box', nm: 'crank-arms', color: pal.metal, c: [0, 0], s: [radius * 2, 6], r: 3 },
      { kind: 'box', nm: 'pedal-a', color: pal.metalDark, c: [radius, 0], s: [27, 9], r: 3 },
      { kind: 'box', nm: 'pedal-b', color: pal.metalDark, c: [-radius, 0], s: [27, 9], r: 3 },
      { kind: 'oval', nm: 'crank-hub', color: pal.metal, c: [0, 0], s: [17, 17] },
    ], at: (_J, t) => ({ p: crank, a: 360 * t }) }],
    pose(t) {
      const theta = TAU * t;
      const pedal = (offset: number): Vec2 => [crank[0] + radius * Math.cos(theta + offset), crank[1] + radius * Math.sin(theta + offset)];
      const handY = recumbent ? 304 : 259;
      return {
        ...seated(hip, recumbent ? -76 : -82),
        legs: { near: { target: pedal(0), foot: 0, side: [1, 0] }, far: { target: pedal(Math.PI), foot: 0, side: [1, 0] } },
        arms: { near: { target: [260, handY], side: [1, 0], hand: 0 }, far: { target: [254, handY + 3], side: [1, 0], hand: 0 } },
      };
    },
  };
}

const ellipticalProps = (pal: any, seatedMode = false): { back: PropShape[]; front: PropShape[] } => ({ back: [
  ...machineBase(pal),
  { kind: 'box', nm: 'elliptical-upright', color: pal.metal, c: [351, 314], s: [15, 231], r: 6 },
  { kind: 'box', nm: 'elliptical-console-arm', color: pal.metal, c: [324, 209], s: [64, 10], r: 4 },
  { kind: 'box', nm: 'elliptical-console', color: pal.propLight, c: [295, 196], s: [56, 34], r: 5 },
  { kind: 'oval', nm: 'elliptical-flywheel', color: pal.metalDark, c: [306, 387], s: [100, 100] },
  { kind: 'ring', nm: 'elliptical-wheel-rim', color: pal.metal, c: [306, 387], s: [77, 77], w: 4 },
  ...(seatedMode ? [
    { kind: 'box', nm: 'cross-seat-post', color: pal.metalDark, c: [169, 359], s: [11, 95], r: 4 },
    { kind: 'box', nm: 'cross-seat', color: pal.pad, c: [180, 315], s: [78, 19], r: 9 },
    { kind: 'box', nm: 'cross-backrest', color: pal.padFar, c: [128, 298], s: [23, 100], r: 10 },
  ] as PropShape[] : []),
], front: [] });

/** Elliptical pedals and handles travel in opposite phases while the feet never leave the pedals. */
export function elliptical(meta: CardioMeta, name: string, seatedMode = false): SideExercise {
  const hip: Vec2 = seatedMode ? [157, 337] : [210, 261];
  return {
    id: '', name, tl: cardioTL, poster: 0.25,
    meta: { ...meta, family: 'cardio', equipment: ['cardio-machine'] },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.45 }, { m: 'hamstrings', side: 'both', scale: 0.4 }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ellipticalProps(pal, seatedMode), propsBox: [50, 430],
    dynamic: [
      { nm: 'Near Pedal Rail', z: 'back', kind: 'curve', width: 9, color: (pal) => pal.metal, at: (J, _t) => [[285, 394], J.ankle_n] },
      { nm: 'Far Pedal Rail', z: 'back', kind: 'curve', width: 8, color: (pal) => pal.metalDark, at: (J, _t) => [[285, 394], J.ankle_f] },
      { nm: 'Near Moving Handle', z: 'underNearArm', kind: 'curve', width: 8, color: (pal) => pal.metal, at: (J, _t) => [[334, 213], J.wrist_n] },
      { nm: 'Far Moving Handle', z: 'overFarArm', kind: 'curve', width: 8, color: (pal) => pal.metalDark, at: (J, _t) => [[330, 216], J.wrist_f] },
    ],
    pose(t) {
      const s = Math.sin(TAU * t), c = Math.cos(TAU * t);
      const pedal = (phase: number): Vec2 => [278 + 38 * phase, 421 - 15 * phase];
      const hand = (phase: number): Vec2 => [278 + 19 * phase, seatedMode ? 280 - 12 * phase : 248 - 20 * phase];
      return {
        ...(seatedMode ? seated(hip, -76) : upright([hip[0], hip[1] + 3 * c])),
        legs: { near: { target: pedal(s), foot: 0, side: [1, 0] }, far: { target: pedal(-s), foot: 0, side: [1, 0] } },
        arms: { near: { target: hand(-s), side: [1, 0], hand: 0 }, far: { target: hand(s), side: [1, 0], hand: 0 } },
      };
    },
  };
}

const stepperProps = (pal: any, mill = false): { back: PropShape[]; front: PropShape[] } => ({ back: [
  ...machineBase(pal),
  { kind: 'box', nm: 'stepper-column', color: pal.metal, c: [310, 326], s: [24, 238], r: 7 },
  { kind: 'box', nm: 'stepper-console', color: pal.propLight, c: [300, 200], s: [72, 42], r: 6 },
  { kind: 'box', nm: 'stepper-rail-a', color: pal.metalDark, c: [260, 284], s: [11, 183], r: 5, rot: -18 },
  { kind: 'box', nm: 'stepper-rail-b', color: pal.metalDark, c: [350, 284], s: [11, 183], r: 5, rot: 18 },
  ...(mill ? Array.from({ length: 6 }, (_, i): PropShape => ({ kind: 'box', nm: `revolving-step-${i}`, color: i % 2 ? pal.prop : pal.metalDark, c: [245 + i * 26, G - 12 - i * 20], s: [84, 18], r: 3 })) : [
    { kind: 'box', nm: 'stepper-pedestal', color: pal.prop, c: [262, 422], s: [158, 45], r: 9 } satisfies PropShape,
  ]),
], front: [] });

/** Alternating pedal pressure with hands lightly gripping the rails. */
export function stepper(meta: CardioMeta, name: string, mill = false): SideExercise {
  return {
    id: '', name, tl: loop(1.0), poster: 0.25,
    meta: { ...meta, family: 'cardio', equipment: ['cardio-machine'] },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.5 }, { m: 'glutes', scale: 0.45 }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
    props: (pal) => stepperProps(pal, mill), propsBox: [65, 420],
    dynamic: [
      { nm: 'Near Pedal', z: 'back', kind: 'rigid', shapes: (pal) => [{ kind: 'box', nm: 'pedal', color: pal.metalDark, c: [0, 0], s: [73, 14], r: 4 }], at: (J) => ({ p: J.ankle_n, a: 0 }) },
      { nm: 'Far Pedal', z: 'back', kind: 'rigid', shapes: (pal) => [{ kind: 'box', nm: 'pedal', color: pal.metal, c: [0, 0], s: [73, 14], r: 4 }], at: (J) => ({ p: J.ankle_f, a: 0 }) },
    ],
    pose(t) {
      const s = Math.sin(TAU * t);
      const foot = (phase: number): Vec2 => [235 + 24 * phase, G - A - (mill ? 36 : 31) * (0.5 + 0.5 * phase)];
      return {
        ...upright([210, 267 + 5 * s]),
        legs: { near: { target: foot(s), foot: 0, side: [1, 0] }, far: { target: foot(-s), foot: 0, side: [1, 0] } },
        arms: { near: { target: [267, 267], side: [1, 0], hand: 0 }, far: { target: [260, 271], side: [1, 0], hand: 0 } },
      };
    },
  };
}

const rowerProps = (pal: any): { back: PropShape[]; front: PropShape[] } => ({ back: [
  ...machineBase(pal),
  { kind: 'box', nm: 'rower-rail', color: pal.metal, c: [235, 378], s: [258, 12], r: 5 },
  { kind: 'box', nm: 'rower-seat-track', color: pal.metalDark, c: [231, 365], s: [234, 5], r: 2 },
  { kind: 'oval', nm: 'rower-flywheel', color: pal.prop, c: [399, 342], s: [113, 113] },
  { kind: 'ring', nm: 'rower-wheel-rim', color: pal.metal, c: [399, 342], s: [89, 89], w: 5 },
  { kind: 'box', nm: 'rower-footplate', color: pal.metalDark, c: [320, 365], s: [25, 101], r: 4, rot: 18 },
], front: [] });

/** The catch has bent knees and a slight forward hinge. The drive ends with straight legs and the handle at the abdomen. */
export function rowing(meta: CardioMeta, name: string): SideExercise {
  return {
    id: '', name, tl: loop(2.5), poster: 0.38,
    meta: { ...meta, family: 'cardio', equipment: ['cardio-machine'] },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.6 }, { m: 'upperBack', scale: 0.55 }, { m: 'biceps', side: 'both', scale: 0.35 }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
    props: (pal) => rowerProps(pal), propsBox: [55, 430],
    dynamic: [
      { nm: 'Rower Handle', z: 'underNearArm', kind: 'rigid', shapes: (pal) => [{ kind: 'box', nm: 'handle', color: pal.metalDark, c: [0, 0], s: [50, 10], r: 5 }], at: (J) => ({ p: add(J.wrist_n, [0, GRIP_IN_HAND]), a: 0 }) },
      { nm: 'Rower Chain', z: 'back', kind: 'line', width: 3, color: (pal) => pal.cable, at: (J) => [[402, 322], add(J.wrist_n, [0, GRIP_IN_HAND])] },
      { nm: 'Sliding Seat', z: 'overFarArm', kind: 'rigid', shapes: (pal) => [{ kind: 'box', nm: 'seat', color: pal.pad, c: [0, 0], s: [58, 18], r: 8 }], at: (J) => ({ p: [J.H[0], 352], a: 0 }) },
    ],
    pose(t) {
      const p = (1 - Math.cos(TAU * t)) / 2; // catch at 0, finish at 0.5
      const hip: Vec2 = [lerp(248, 155, p), 335];
      const foot: Vec2 = [329, 389];
      const wrist: Vec2 = [lerp(394, 230, p), lerp(248, 276, p)];
      return {
        ...seated(hip, lerp(-75, -105, p)),
        legs: { near: { target: foot, foot: 0, side: [1, 0] }, far: { target: [foot[0] - 3, foot[1]], foot: 0, side: [1, 0] } },
        arms: { near: { target: wrist, side: [1, 0], hand: 0 }, far: { target: [wrist[0] - 4, wrist[1] + 3], side: [1, 0], hand: 0 } },
      };
    },
  };
}

const skiProps = (pal: any): { back: PropShape[]; front: PropShape[] } => ({ back: [
  ...machineBase(pal),
  { kind: 'box', nm: 'ski-tower', color: pal.prop, c: [348, 266], s: [31, 347], r: 7 },
  { kind: 'oval', nm: 'ski-top-wheel', color: pal.metalDark, c: [335, 111], s: [48, 48] },
], front: [] });

/** The standing double-pole pull starts high, then hinges forward as both handles reach the thighs. */
export function skiErg(meta: CardioMeta, name: string): SideExercise {
  return {
    id: '', name, tl: loop(2.8), poster: 0.5,
    meta: { ...meta, family: 'cardio', equipment: ['cardio-machine'] },
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.45 }, { m: 'forearms', side: 'both', scale: 0.35 }, { m: 'abs', scale: 0.3 }],
    props: (pal) => skiProps(pal), propsBox: [60, 400],
    dynamic: [
      { nm: 'Near Ski Cable', z: 'back', kind: 'line', width: 3, color: (pal) => pal.cable, at: (J) => [[335, 111], add(J.wrist_n, [0, GRIP_IN_HAND])] },
      { nm: 'Far Ski Cable', z: 'back', kind: 'line', width: 3, color: (pal) => pal.cable, at: (J) => [[340, 115], add(J.wrist_f, [0, GRIP_IN_HAND])] },
      { nm: 'Near Ski Handle', z: 'underNearArm', kind: 'rigid', shapes: (pal) => [{ kind: 'box', nm: 'handle', color: pal.padFar, c: [0, 0], s: [12, 31], r: 5 }], at: (J) => ({ p: add(J.wrist_n, [0, GRIP_IN_HAND]), a: 0 }) },
    ],
    pose(t) {
      const p = (1 - Math.cos(TAU * t)) / 2;
      const hand: Vec2 = [lerp(311, 267, p), lerp(143, 294, p)];
      return {
        ...upright([194, lerp(269, 282, p)]),
        spine: { lumbar: lerp(-84, -58, p), thoracic: lerp(-84, -58, p) }, neck: lerp(-84, -58, p), head: lerp(-84, -58, p),
        legs: { near: { target: [174, G - A], foot: 0, side: [1, 0] }, far: { target: [216, G - A], foot: 0, side: [1, 0] } },
        arms: { near: { target: hand, side: [1, 0], hand: 90 }, far: { target: [hand[0] - 5, hand[1] + 3], side: [1, 0], hand: 90 } },
      };
    },
  };
}

const upperErgProps = (pal: any): { back: PropShape[]; front: PropShape[] } => ({ back: [
  ...machineBase(pal),
  { kind: 'box', nm: 'upper-erg-column', color: pal.prop, c: [348, 278], s: [27, 252], r: 6 },
  { kind: 'oval', nm: 'upper-erg-housing', color: pal.metalDark, c: [240, 260], s: [101, 101] },
  { kind: 'ring', nm: 'upper-erg-ring', color: pal.metal, c: [240, 260], s: [77, 77], w: 4 },
  { kind: 'box', nm: 'upper-erg-seat-post', color: pal.metalDark, c: [168, 379], s: [10, 73], r: 4 },
  { kind: 'box', nm: 'upper-erg-seat', color: pal.pad, c: [172, 345], s: [79, 21], r: 9 },
  { kind: 'box', nm: 'upper-erg-footrest', color: pal.metalDark, c: [233, 397], s: [63, 13], r: 4 },
], front: [] });

/** The arms cycle opposite hand cranks. Each hand stays on its own rotating grip. */
export function upperErgometer(meta: CardioMeta, name: string): SideExercise {
  const crank: Vec2 = [240, 260], r = 18;
  return {
    id: '', name, tl: cardioTL, poster: 0.125,
    meta: { ...meta, family: 'cardio', equipment: ['cardio-machine'] },
    muscles: [{ m: 'pecs', scale: 0.65 }, { m: 'delts', side: 'both', scale: 0.5 }, { m: 'triceps', side: 'both', scale: 0.45 }, { m: 'forearms', side: 'both', scale: 0.3 }],
    props: (pal) => upperErgProps(pal), propsBox: [50, 405],
    dynamic: [{ nm: 'Hand Cranks', z: 'underNearArm', kind: 'rigid', shapes: (pal) => [
      { kind: 'box', nm: 'crank', color: pal.metal, c: [0, 0], s: [r * 2, 6], r: 3 },
      { kind: 'box', nm: 'grip-a', color: pal.padFar, c: [r, 0], s: [10, 27], r: 4 },
      { kind: 'box', nm: 'grip-b', color: pal.padFar, c: [-r, 0], s: [10, 27], r: 4 },
      { kind: 'oval', nm: 'hub', color: pal.metalDark, c: [0, 0], s: [17, 17] },
    ], at: (_J, t) => ({ p: crank, a: 360 * t }) }],
    pose(t) {
      const theta = TAU * t;
      const handle = (o: number): Vec2 => [crank[0] + r * Math.cos(theta + o), crank[1] + r * Math.sin(theta + o)];
      return {
        ...seated([170, 345], -88),
        legs: { near: { target: [233, 398], foot: 0, side: [1, 0] }, far: { target: [228, 398], foot: 0, side: [1, 0] } },
        arms: { near: { target: handle(0), side: [1, 0], hand: 90 }, far: { target: handle(Math.PI), side: [1, 0], hand: 90 } },
      };
    },
  };
}

/** Two anchored ropes show opposite travelling waves. The knees stay soft and the hands alternate between hip and shoulder height. */
export function battleRope(meta: CardioMeta, name: string): SideExercise {
  return {
    id: '', name, tl: loop(0.8), poster: 0.125,
    meta: { ...meta, family: 'cardio', equipment: ['rope'] },
    muscles: [{ m: 'delts', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.55 }, { m: 'pecs', scale: 0.35 }, { m: 'quads', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: [{ kind: 'box', nm: 'rope-anchor', color: pal.metalDark, c: [440, 358], s: [19, 19], r: 4 }], front: [] }), propsBox: [100, 455],
    dynamic: [
      { nm: 'Near Battle Rope', z: 'front', kind: 'curve', width: 8, color: (pal) => pal.cable, at: (J, t) => {
        const s = Math.sin(TAU * t);
        const h = add(J.wrist_n, [0, GRIP_IN_HAND]);
        return [h, [310, 300 + 22 * s], [365, 337 - 19 * s], [440, 358]];
      } },
      { nm: 'Far Battle Rope', z: 'back', kind: 'curve', width: 7, color: (pal) => pal.metalDark, at: (J, t) => {
        const s = Math.sin(TAU * t + Math.PI);
        const h = add(J.wrist_f, [0, GRIP_IN_HAND]);
        return [h, [310, 300 + 22 * s], [365, 337 - 19 * s], [440, 358]];
      } },
    ],
    pose(t) {
      const s = Math.sin(TAU * t);
      const hand = (phase: number): Vec2 => [260, 265 - 27 * phase];
      return {
        ...upright([200, 278]),
        spine: { lumbar: -78, thoracic: -76 }, neck: -76, head: -76,
        legs: { near: { target: [180, G - A], foot: 0, side: [1, 0] }, far: { target: [224, G - A], foot: 0, side: [1, 0] } },
        arms: { near: { target: hand(s), side: [1, 0], hand: 0 }, far: { target: hand(-s), side: [1, 0], hand: 0 } },
      };
    },
  };
}

/** Rope alternates between an overhead arc and the floor. The feet hop only while it passes beneath them. */
export function jumpRope(meta: CardioMeta, name: string): SideExercise {
  return {
    id: '', name, tl: loop(0.9), poster: 0.5,
    meta: { ...meta, family: 'cardio', equipment: ['rope'] },
    muscles: [{ m: 'calves', side: 'both' }, { m: 'quads', side: 'both', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.3 }, { m: 'hamstrings', side: 'both', scale: 0.3 }],
    dynamic: [{ nm: 'Jump Rope', z: 'front', kind: 'curve', width: 4, color: (pal) => pal.cable, at: (J, t) => {
      const overhead = (1 + Math.cos(TAU * t)) / 2;
      const a = add(J.wrist_n, [0, GRIP_IN_HAND]), b = add(J.wrist_f, [0, GRIP_IN_HAND]);
      const ys = lerp(446, 85, overhead);
      return [a, [190, lerp(415, 174, overhead)], [220, ys], [250, lerp(415, 174, overhead)], b];
    } }],
    pose(t) {
      const below = Math.max(0, -Math.cos(TAU * t));
      const h = 15 * below;
      const hip: Vec2 = [218, 257 - h];
      return {
        ...upright(hip),
        legs: {
          near: { target: [208, G - A - h], foot: 0, side: [1, 0] },
          far: { target: [228, G - A - h], foot: 0, side: [1, 0] },
        },
        arms: { near: { a1: 72, a2: 77, hand: 90 }, far: { a1: 108, a2: 103, hand: 90 } },
      };
    },
  };
}

/** A full burpee moves through squat, high plank, push-up, squat and a locked-out overhead press. */
export function dumbbellBurpee(meta: CardioMeta, name: string): SideExercise {
  type BurpeeState = { hip: Vec2; spine: number; feet: [Vec2, Vec2]; hands: [Vec2, Vec2]; foot: number; hand: number; press: number };
  const stand: BurpeeState = { hip: [210, 270], spine: -90, feet: [[195, G - A], [228, G - A]], hands: [[225, 25], [207, 25]], foot: 0, hand: 90, press: 1 };
  const squat: BurpeeState = { hip: [180, 356], spine: -38, feet: [[172, G - A], [230, G - A]], hands: [[280, 400], [270, 403]], foot: 0, hand: 90, press: 0 };
  const plank: BurpeeState = { hip: [180, 325], spine: -3, feet: [[35, G - 41], [58, G - 41]], hands: [[310, 402], [300, 405]], foot: 85, hand: 90, press: 0 };
  const pushUp: BurpeeState = { hip: [180, 344], spine: -3, feet: [[35, G - 41], [58, G - 41]], hands: [[310, 402], [300, 405]], foot: 85, hand: 90, press: 0 };
  const states: BurpeeState[] = [stand, squat, plank, pushUp, plank, squat, stand, stand];
  const stops = [0, 0.13, 0.29, 0.39, 0.49, 0.67, 0.84, 1];
  const stateAt = (t: number): BurpeeState => {
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1]!) i++;
    const a = states[i]!, b = states[i + 1]!;
    const u = (t - stops[i]!) / (stops[i + 1]! - stops[i]!);
    const v = u * u * (3 - 2 * u);
    const mix = (x: Vec2, y: Vec2): Vec2 => [lerp(x[0], y[0], v), lerp(x[1], y[1], v)];
    return { hip: mix(a.hip, b.hip), spine: lerp(a.spine, b.spine, v), feet: [mix(a.feet[0], b.feet[0]), mix(a.feet[1], b.feet[1])], hands: [mix(a.hands[0], b.hands[0]), mix(a.hands[1], b.hands[1])], foot: lerp(a.foot, b.foot, v), hand: lerp(a.hand, b.hand, v), press: lerp(a.press, b.press, v) };
  };
  return {
    id: '', name, tl: timeline([{ d: 0.55, from: 0, to: 0.3, e: [0.35, 0.8] }, { d: 0.65, from: 0.3, to: 0.55, e: [0.8, 1] }, { d: 1.15, from: 0.55, to: 1, e: [1, 0.5] }, { d: 0.7, from: 1, to: 1, e: [0.5, 0.5] }]), poster: 0.84,
    meta: { ...meta, family: 'cardio', equipment: ['dumbbell'] }, mat: true,
    muscles: [{ m: 'quads', side: 'both' }, { m: 'pecs', scale: 0.6 }, { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'delts', side: 'both', scale: 0.5 }, { m: 'calves', side: 'both', scale: 0.35 }],
    dynamic: [dumbbell('n', 'profile'), dumbbell('f', 'profile')],
    pose(t) {
      const p = stateAt(t);
      return {
        hip: p.hip,
        spine: { lumbar: p.spine, thoracic: p.spine }, neck: p.spine, head: p.spine,
        legs: {
          near: { target: p.feet[0], foot: p.foot, side: [0, 1] },
          far: { target: p.feet[1], foot: p.foot, side: [0, 1] },
        },
        arms: {
          near: { target: (J) => [lerp(p.hands[0][0], J.S[0], p.press), lerp(p.hands[0][1], J.S[1] - 124, p.press)], side: [1, 0], hand: p.hand },
          far: { target: (J) => [lerp(p.hands[1][0], J.Sf[0], p.press), lerp(p.hands[1][1], J.Sf[1] - 124, p.press)], side: [1, 0], hand: p.hand },
        },
      };
    },
  };
}
