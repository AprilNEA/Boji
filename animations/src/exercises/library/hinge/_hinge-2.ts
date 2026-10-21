// Private builders for hinge-2. Each builder fixes the feet or seat, then moves the hips and the implement together.
// The side poses keep a neutral head and spine. The deadlift variants use straight arm targets only when a bar must stay
// at a fixed height. The less constrained hinges use fixed limb directions to avoid artificial reaches at the bottom.
import type { EquipmentTag, MovingPart, MuscleSpec, PropShape, SideExercise } from '@/exercise.ts';
import { add, clamp, lerp, sub, type Vec2 } from '@/math/vec2.ts';
import { smooth, timeline } from '@/math/timeline.ts';
import type { Palette } from '@/draw/palettes.ts';
import type { Joints, Pose } from '@/rig/side.ts';
import { A, ARM_STRAIGHT, G, GRIP_IN_HAND, handOnHip, hipForShoulder, standLegs } from '@/exercises/common.ts';
import {
  BARBELL, PLATE, aerobicStep, barbell, baseRail, cableColumn, cableHandle, cableLine, dumbbell, gripAt,
  kettlebell, smithRails, tube, towardCable, workTL,
} from '@/exercises/equipment/index.ts';

export interface HingeBase {
  id: string;
  name: string;
  en: string;
  equipment: EquipmentTag[];
  sources: string[];
  muscles: MuscleSpec[];
}

type DeadliftImplement = 'barbell' | 'dumbbell' | 'axle' | 'machine' | 'frame' | 'car' | 'trap' | 'cable';

const deadliftTL = timeline([
  { d: 1.15, from: 0, to: 1, e: [0.45, 1] },
  { d: 0.3, from: 1, to: 1, e: [1, 0.85] },
  { d: 1.55, from: 1, to: 0, e: [0.82, 0.45] },
  { d: 0.4, from: 0, to: 0, e: [0.35, 0.35] },
]);
const rdlTL = timeline([
  { d: 1.05, from: 0, to: 1, e: [0.5, 1] },
  { d: 0.35, from: 1, to: 1, e: [1, 0.85] },
  { d: 1.65, from: 1, to: 0, e: [0.85, 0.42] },
  { d: 0.4, from: 0, to: 0, e: [0.35, 0.35] },
]);

const X0 = 262;
const BX = X0 + 14;
const H_FLOOR = PLATE.full / 2;
const H_KNEE = 100;
const H_TOP = 168;

function deadliftTorso(h: number, sumo: boolean): { th: number; d: number } {
  if (h <= H_KNEE) {
    const u = (h - H_FLOOR) / (H_KNEE - H_FLOOR);
    return { th: lerp(sumo ? -40 : -26, -36, u), d: lerp(9, 3, u) };
  }
  const u = smooth(clamp((h - H_KNEE) / (H_TOP - H_KNEE), 0, 1));
  return { th: lerp(-36, -91, u), d: lerp(3, -15, u) };
}

function floorDeadliftPose(p: number, opts: { sumo?: boolean; gripDx?: number } = {}): Pose {
  const h = lerp(H_FLOOR, H_TOP, p);
  const { th, d } = deadliftTorso(h, opts.sumo ?? false);
  const grip: Vec2 = [BX + (opts.gripDx ?? 0), G - h];
  const wrist: Vec2 = [grip[0], grip[1] - GRIP_IN_HAND];
  const S: Vec2 = [grip[0] + d, wrist[1] - Math.sqrt(ARM_STRAIGHT * ARM_STRAIGHT - d * d)];
  const spine = { lumbar: th + 1, thoracic: th - 1 };
  return {
    hip: hipForShoulder(S, spine), spine, neck: th + 3, head: th + 1,
    farHip: 0, legs: standLegs(X0, opts.sumo ? -12 : 0),
    arms: {
      near: { target: wrist, side: [-1, 0], hand: 90 },
      far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
    },
  };
}

const axleShapes = (pal: Palette): PropShape[] => [
  { kind: 'oval', nm: 'thick-axle-load', color: pal.plate, c: [0, 0], s: [68, 68] },
  { kind: 'ring', nm: 'thick-axle-rim', color: pal.metalDark, c: [0, 0], s: [50, 50], w: 4 },
  { kind: 'oval', nm: 'thick-axle-hub', color: pal.metal, c: [0, 0], s: [22, 22] },
  { kind: 'box', nm: 'thick-axle', color: pal.metalDark, c: [0, 0], s: [26, 12], r: 5 },
];

const trapShapes = (pal: Palette): PropShape[] => [
  { kind: 'poly', nm: 'hex-frame', color: pal.metalDark, pts: [[-72, -25], [-45, -67], [45, -67], [72, -25], [45, 55], [-45, 55]], w: 11, closed: true },
  { kind: 'box', nm: 'hex-near-handle', color: pal.padFar, c: [0, -25], s: [42, 10], r: 5 },
  { kind: 'oval', nm: 'hex-near-load', color: pal.plate, c: [61, 35], s: [48, 48] },
  { kind: 'oval', nm: 'hex-far-load', color: pal.plate, c: [-61, 35], s: [48, 48] },
];

const frameShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'frame-grip', color: pal.padFar, c: [0, -4], s: [58, 10], r: 4 },
  { kind: 'box', nm: 'frame-rail', color: pal.metalDark, c: [0, 61], s: [228, 16], r: 4 },
  { kind: 'box', nm: 'frame-front-post', color: pal.metal, c: [96, 25], s: [16, 92], r: 4 },
  { kind: 'box', nm: 'frame-back-post', color: pal.metal, c: [-96, 25], s: [16, 92], r: 4 },
  { kind: 'oval', nm: 'frame-near-load', color: pal.plate, c: [101, 48], s: [52, 52] },
  { kind: 'oval', nm: 'frame-far-load', color: pal.plate, c: [-101, 48], s: [52, 52] },
];

const machineHandleShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'lever-handle', color: pal.padFar, c: [0, 0], s: [48, 10], r: 5 },
  { kind: 'box', nm: 'lever-arm', color: pal.metal, c: [-37, 30], s: [15, 74], r: 5 },
  { kind: 'oval', nm: 'lever-load', color: pal.plate, c: [-37, 67], s: [52, 52] },
  { kind: 'oval', nm: 'lever-hub', color: pal.metalDark, c: [-37, 30], s: [19, 19] },
];

function chainsForBar(): MovingPart<Joints> {
  return {
    nm: 'barbell loading chain', kind: 'curve', z: 'front', width: 5, color: (pal) => pal.metalDark,
    at: (J) => {
      const p = gripAt(J, 'n');
      const floorY = G - 7;
      return [[p[0] + 24, p[1]], [p[0] + 37, (p[1] + floorY) / 2], [p[0] + 51, floorY], [p[0] + 73, floorY]];
    },
  };
}

const CAR_ANCHOR: Vec2 = [BX, G - H_FLOOR];
const carShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'car-body', color: pal.prop, c: [92 - CAR_ANCHOR[0], G - 93 - CAR_ANCHOR[1]], s: [142, 58], r: 12 },
  { kind: 'box', nm: 'car-roof', color: pal.propLight, c: [67 - CAR_ANCHOR[0], G - 135 - CAR_ANCHOR[1]], s: [79, 36], r: 11 },
  { kind: 'box', nm: 'car-window', color: pal.metalDark, c: [66 - CAR_ANCHOR[0], G - 139 - CAR_ANCHOR[1]], s: [54, 22], r: 7 },
  { kind: 'oval', nm: 'car-wheel-back', color: pal.metalDark, c: [42 - CAR_ANCHOR[0], G - 51 - CAR_ANCHOR[1]], s: [36, 36] },
  { kind: 'oval', nm: 'car-wheel-front', color: pal.metalDark, c: [139 - CAR_ANCHOR[0], G - 51 - CAR_ANCHOR[1]], s: [36, 36] },
  { kind: 'box', nm: 'car-deadlift-link', color: pal.metal, c: [170 - CAR_ANCHOR[0], G - 62 - CAR_ANCHOR[1]], s: [70, 12], r: 5 },
];

export function floorDeadlift(o: HingeBase, opts: { implement: DeadliftImplement; sumo?: boolean; chains?: boolean; smith?: boolean } ): SideExercise {
  const gripDx = opts.implement === 'dumbbell' ? 8 : 0;
  const smith = opts.smith ? smithRails({ view: 'side', x: BX, top: 36 }) : undefined;
  const columnA = opts.implement === 'cable' ? cableColumn({ x: 146, pulleyY: G - 56, toward: 1 }) : undefined;
  const columnB = opts.implement === 'cable' ? cableColumn({ x: 390, pulleyY: G - 56, toward: -1 }) : undefined;
  const dynamic: NonNullable<SideExercise['dynamic']> = [];
  if (opts.implement === 'barbell') dynamic.push(barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) }));
  if (opts.implement === 'dumbbell') dynamic.push(dumbbell('f', 'profile'), dumbbell('n', 'profile'));
  if (opts.implement === 'axle') dynamic.push({ nm: 'thick axle', kind: 'rigid', z: 'front', shapes: axleShapes, at: (J) => ({ p: gripAt(J, 'n') }) });
  if (opts.implement === 'trap') dynamic.push({ nm: 'trap bar', kind: 'rigid', z: 'back', shapes: trapShapes, at: (J) => ({ p: gripAt(J, 'n') }) });
  if (opts.implement === 'frame' || opts.implement === 'car') dynamic.push({ nm: opts.implement === 'car' ? 'car-deadlift frame' : 'rickshaw frame', kind: 'rigid', z: 'back', shapes: frameShapes, at: (J) => ({ p: gripAt(J, 'n') }) });
  if (opts.implement === 'car') dynamic.push({ nm: 'vehicle load', kind: 'rigid', z: 'back', shapes: carShapes, at: (J) => ({ p: gripAt(J, 'n') }) });
  if (opts.implement === 'machine') dynamic.push({ nm: 'leverage deadlift handle', kind: 'rigid', z: 'underNearArm', shapes: machineHandleShapes, at: (J) => ({ p: gripAt(J, 'n') }) });
  if (opts.implement === 'cable' && columnA && columnB) {
    dynamic.push(
      cableLine(columnA.pulley, (J) => gripAt(J, 'f'), 'far low cable'),
      cableLine(columnB.pulley, (J) => gripAt(J, 'n'), 'near low cable'),
      cableHandle('d', (J) => ({ p: gripAt(J, 'f'), a: towardCable(gripAt(J, 'f'), columnA.pulley) })),
      cableHandle('d', (J) => ({ p: gripAt(J, 'n'), a: towardCable(gripAt(J, 'n'), columnB.pulley) })),
    );
  }
  if (opts.chains) dynamic.push(chainsForBar());
  return {
    ...o, tl: deadliftTL, meta: { en: o.en, family: 'hinge', equipment: o.equipment, sources: o.sources },
    props: (pal) => ({
      back: [
        ...(smith?.draw(pal) ?? []), ...(columnA?.draw(pal) ?? []), ...(columnB?.draw(pal) ?? []),
        ...(opts.implement === 'machine' ? [
          baseRail(pal, 186, 351, 'leverage-base'),
          tube(pal, 'leverage-upright', [187, G - 5], [187, G - 170]),
          tube(pal, 'leverage-crossbar', [187, G - 170], [258, G - 170], { dark: true }),
        ] : []),
      ],
    }),
    propsBox: opts.implement === 'cable' ? [120, 415] : opts.implement === 'car' ? [15, 390] : opts.implement === 'frame' || opts.implement === 'trap' ? [120, 405] : undefined,
    dynamic,
    // The floor start shows the stance, grip, and implement more clearly than a generic tall finish.
    poster: 0,
    pose: (t) => floorDeadliftPose(deadliftTL.at(t).p, { sumo: opts.sumo, gripDx }),
  };
}

function rdlPose(p: number, wide: boolean): Pose {
  const b = 1 - p;
  const hp = Math.sin((b * Math.PI) / 2);
  const hip: Vec2 = [lerp(272, 214, hp), lerp(G - 13 - 180, G - 13 - 169, hp)];
  const spineAngle = lerp(-88, -14, b);
  const arm = lerp(84, 99, b);
  return {
    hip, spine: { lumbar: spineAngle, thoracic: spineAngle - 1 }, neck: spineAngle + 3, head: spineAngle + 5,
    farHip: 0, legs: standLegs(280, wide ? -8 : 0),
    arms: {
      near: { a1: arm, a2: arm - 1, hand: arm - 1 },
      far: { a1: arm + 1, a2: arm, hand: arm },
    },
  };
}

export function stiffLegDeadlift(o: HingeBase, opts: { implement: 'barbell' | 'dumbbell'; wide?: boolean; smith?: boolean }): SideExercise {
  const rails = opts.smith ? smithRails({ view: 'side', x: 310, top: 36 }) : undefined;
  return {
    ...o, tl: rdlTL, meta: { en: o.en, family: 'hinge', equipment: o.equipment, sources: o.sources },
    muscles: o.muscles,
    props: (pal) => ({ back: rails?.draw(pal) ?? [] }), propsBox: rails?.box,
    dynamic: opts.implement === 'barbell'
      ? [barbell({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })]
      : [dumbbell('f', 'profile'), dumbbell('n', 'profile')],
    // The hinge at maximum hamstring length is the defining still.
    poster: 0,
    pose: (t) => rdlPose(rdlTL.at(t).p, opts.wide ?? false),
  };
}

function goodMorningPose(p: number, bar: boolean): Pose {
  const b = 1 - p;
  const hip: Vec2 = [lerp(262, 215, b), lerp(259, 270, b)];
  const a = lerp(-90, -10, b);
  const spine = { lumbar: a, thoracic: a - 1 };
  return {
    hip, spine, neck: a + 3, head: a + 5, farHip: 0, legs: standLegs(270, 0),
    arms: bar
      ? {
        near: { target: (J) => add(backBar(J), [-13, 12]), side: [-1, 0], hand: 180 },
        far: { target: (J) => add(add(backBar(J), [-13, 12]), sub(J.Sf, J.S)), side: [-1, 0], hand: 180 },
      }
      : { near: handOnHip(0), far: handOnHip(-3) },
  };
}

function backBar(J: Joints): Vec2 { return add(J.S, [-18, 8]); }

export function goodMorning(o: HingeBase, opts: { suspended?: boolean; smith?: boolean; bodyweight?: boolean } = {}): SideExercise {
  const rackX = 182;
  const rail = opts.smith ? smithRails({ view: 'side', x: 281, top: 36 }) : undefined;
  const dynamic: NonNullable<SideExercise['dynamic']> = [];
  if (!opts.bodyweight) dynamic.push(barbell({ view: 'side', plate: 'medium', z: 'overFarArm', at: (J) => ({ p: backBar(J) }) }));
  if (opts.suspended) {
    dynamic.push({
      nm: 'suspension chains', kind: 'curve', z: 'back', width: 5, color: (pal) => pal.metalDark,
      at: (J) => {
        const b = backBar(J);
        return [[rackX + 14, 102], [rackX + 31, (102 + b[1]) / 2], [b[0] - 22, b[1] - 8], [b[0], b[1]]];
      },
    });
  }
  return {
    ...o, tl: rdlTL, meta: { en: o.en, family: 'hinge', equipment: o.equipment, sources: o.sources },
    props: (pal): { back: PropShape[] } => ({ back: [
      ...(rail?.draw(pal) ?? []),
      ...(opts.suspended ? [
        { kind: 'box' as const, nm: 'suspension-rack-base', color: pal.metalDark, c: [rackX, G - 4] as Vec2, s: [96, 8] as Vec2, r: 3 },
        { kind: 'box' as const, nm: 'suspension-rack-post', color: pal.prop, c: [rackX, (74 + G) / 2] as Vec2, s: [15, G - 74] as Vec2, r: 4 },
        { kind: 'box' as const, nm: 'suspension-rack-arm', color: pal.prop, c: [rackX + 38, 80] as Vec2, s: [88, 13] as Vec2, r: 4 },
      ] : []),
    ] }),
    propsBox: opts.suspended ? [130, 350] : rail?.box,
    // The flexed hip position distinguishes a good morning from standing with a bar.
    dynamic, poster: 0,
    pose: (t) => goodMorningPose(rdlTL.at(t).p, !opts.bodyweight),
  };
}

function smithGoodMorningPose(p: number): Pose {
  const b = 1 - p;
  const a = lerp(-90, -18, b);
  const spine = { lumbar: a, thoracic: a - 1 };
  // Keep the hips high enough for a hip hinge, not a deep squat, at the forward position.
  const shoulder: Vec2 = [310, lerp(158, 237, b)];
  const hip = hipForShoulder(shoulder, spine);
  return {
    hip, spine, neck: a + 3, head: a + 5, farHip: 0, legs: standLegs(265, 0),
    arms: {
      near: { target: (J) => add([310, shoulder[1]], [-13, 12]), side: [-1, 0], hand: 180 },
      far: { target: (J) => add(add([310, shoulder[1]], [-13, 12]), sub(J.Sf, J.S)), side: [-1, 0], hand: 180 },
    },
  };
}

export function smithGoodMorning(o: HingeBase): SideExercise {
  const rail = smithRails({ view: 'side', x: 310, top: 36 });
  return {
    ...o, tl: rdlTL, meta: { en: o.en, family: 'hinge', equipment: o.equipment, sources: o.sources },
    props: (pal) => ({ back: rail.draw(pal) }), propsBox: rail.box,
    dynamic: [barbell({ view: 'side', plate: 'medium', z: 'overFarArm', at: (_J, t) => ({ p: [310, lerp(237, 158, rdlTL.at(t).p)] }) })],
    poster: 0,
    pose: (t) => smithGoodMorningPose(rdlTL.at(t).p),
  };
}

function pullThroughPose(p: number): Pose {
  const b = 1 - p;
  const hp = Math.sin((b * Math.PI) / 2);
  const hip: Vec2 = [lerp(270, 218, hp), lerp(259, 270, hp)];
  // The source calls for a near-parallel torso at the bottom of the pull-through.
  const a = lerp(-89, -10, b);
  const arm = lerp(102, 124, b);
  return {
    hip, spine: { lumbar: a, thoracic: a - 2 }, neck: a + 3, head: a + 5, farHip: 0, legs: standLegs(278, -18),
    arms: {
      near: { a1: arm, a2: arm, hand: arm },
      far: { a1: arm + 1, a2: arm + 1, hand: arm + 1 },
    },
  };
}

export function cablePullThrough(o: HingeBase): SideExercise {
  const column = cableColumn({ x: 119, pulleyY: G - 60, toward: 1 });
  const ropeAt = (J: Joints): Vec2 => gripAt(J, 'n');
  return {
    ...o, tl: rdlTL, meta: { en: o.en, family: 'hinge', equipment: o.equipment, sources: o.sources },
    props: (pal) => ({ back: column.draw(pal) }), propsBox: [85, 350],
    dynamic: [
      cableLine(column.pulley, ropeAt, 'pull-through cable'),
      cableHandle('rope', (J) => ({ p: ropeAt(J), a: towardCable(ropeAt(J), column.pulley) }), { spread: 16 }),
    ],
    poster: 0,
    pose: (t) => pullThroughPose(rdlTL.at(t).p),
  };
}

function sumoPullPose(p: number): Pose {
  const b = 1 - p;
  const hip: Vec2 = [lerp(266, 238, b), lerp(259, 297, b)];
  const a = lerp(-90, -38, b);
  const arm = lerp(89, 108, b);
  return {
    hip, spine: { lumbar: a, thoracic: a - 1 }, neck: a + 3, head: a + 5, farHip: 0, legs: standLegs(278, -34),
    arms: { near: { a1: arm, a2: arm, hand: arm }, far: { a1: arm + 1, a2: arm + 1, hand: arm + 1 } },
  };
}

export function dumbbellSumoPullThrough(o: HingeBase): SideExercise {
  return {
    ...o, tl: rdlTL, meta: { en: o.en, family: 'hinge', equipment: o.equipment, sources: o.sources },
    // A profile dumbbell shows its handle and two plates between both hands.
    dynamic: [dumbbell('n', 'profile')],
    poster: 0,
    pose: (t) => sumoPullPose(rdlTL.at(t).p),
  };
}

function singleLegPose(p: number, rearStep: boolean): Pose {
  const b = 1 - p;
  const hip: Vec2 = [lerp(266, 246, b), lerp(259, 258, b)];
  const a = lerp(-90, -2, b);
  const arm = lerp(90, 90, b);
  return {
    hip, spine: { lumbar: a, thoracic: a - 1 }, neck: a + 2, head: a + 3, farHip: 0,
    legs: {
      near: { target: [270, G - 13], side: [1, 0], foot: 0 },
      far: rearStep
        ? { target: [188, G - 31 - A], side: [1, 0], foot: 0 }
        : { a1: lerp(90, 180, b), a2: lerp(90, 180, b), foot: lerp(0, 180, b) },
    },
    arms: {
      near: { a1: arm, a2: arm, hand: arm },
      far: { a1: arm + 1, a2: arm + 1, hand: arm + 1 },
    },
  };
}

export function singleLegDeadlift(o: HingeBase, opts: { kettlebell?: boolean; opposite?: boolean; rearStep?: boolean } = {}): SideExercise {
  const step = opts.rearStep ? aerobicStep({ x: 173, h: 31, w: 108 }) : undefined;
  const side = opts.opposite ? 'f' : 'n';
  return {
    ...o, tl: rdlTL, meta: { en: o.en, family: 'hinge', equipment: o.equipment, sources: o.sources },
    props: (pal) => ({ back: step?.draw(pal) ?? [] }), propsBox: step?.box,
    dynamic: opts.kettlebell
      ? [kettlebell((J) => ({ p: gripAt(J, side) }), 'edge', side === 'n' ? 'front' : 'overFarArm')]
      : [dumbbell(side, 'profile')],
    // The long horizontal body line, or the supported rear foot, identifies the variation.
    poster: 0,
    pose: (t) => singleLegPose(rdlTL.at(t).p, opts.rearStep ?? false),
  };
}

function seatedGoodMorningPose(p: number): Pose {
  const b = 1 - p;
  const a = lerp(-103, -12, b);
  return {
    hip: [218, 330], spine: { lumbar: a, thoracic: a - 2 }, neck: a + 3, head: a + 4, farHip: 0,
    legs: {
      near: { a1: 12, a2: 90, foot: 0 },
      far: { a1: 12, a2: 90, foot: 0 },
    },
    arms: {
      // The torso-pad handles travel with the upper lever, so the hands keep their grasp throughout the hinge.
      near: { a1: 108, a2: 132, hand: 180 },
      far: { a1: 110, a2: 134, hand: 180 },
    },
  };
}

export function seatedGoodMorning(o: HingeBase): SideExercise {
  const seatX = 232;
  return {
    ...o, tl: rdlTL, meta: { en: o.en, family: 'hinge', equipment: o.equipment, sources: o.sources },
    props: (pal) => ({ back: [
      baseRail(pal, 146, 390, 'seated-good-morning-base'),
      tube(pal, 'seat-post', [seatX, G - 5], [seatX, 350]),
      { kind: 'box', nm: 'seat', color: pal.pad, c: [232, 348], s: [122, 18], r: 8 },
      tube(pal, 'chest-pad-post', [337, G - 5], [337, 274]),
      { kind: 'box', nm: 'torso-pad', color: pal.padFar, c: [331, 276], s: [24, 106], r: 10, rot: -10 },
      { kind: 'box', nm: 'footrest', color: pal.metalDark, c: [344, G - 19], s: [65, 10], r: 4 },
    ] }),
    propsBox: [132, 401], poster: 0,
    dynamic: [
      { nm: 'near torso-pad handle', kind: 'rigid', z: 'underNearArm', shapes: (pal) => [
        { kind: 'box', nm: 'near-handle', color: pal.metalDark, c: [0, 0], s: [26, 8], r: 4 },
      ], at: (J) => ({ p: gripAt(J, 'n'), a: J.hand_n.a }) },
      { nm: 'far torso-pad handle', kind: 'rigid', z: 'overFarArm', shapes: (pal) => [
        { kind: 'box', nm: 'far-handle', color: pal.metalDark, c: [0, 0], s: [26, 8], r: 4 },
      ], at: (J) => ({ p: gripAt(J, 'f'), a: J.hand_f.a }) },
    ],
    pose: (t) => seatedGoodMorningPose(rdlTL.at(t).p),
  };
}
