// Shared side and front poses for the carry-strongman family.
// The helpers keep feet, hands, straps and carried implements connected to the rig.
import type { EquipmentTag, FrontExercise, MuscleSpec, PropShape, SideExercise } from '@/exercise.ts';
import { add, lerp, sub, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { BODY, GROUND, type Joints, type Pose } from '@/rig/side.ts';
import { project, type FrontJoints } from '@/rig/front.ts';
import { A, ARM_STRAIGHT, G, GRIP_IN_HAND, QUAD, hipForShoulder, standLegs } from '@/exercises/common.ts';
import type { Palette } from '@/draw/palettes.ts';

export interface StrongmanBase {
  id: string;
  name: string;
  en: string;
  sources: string[];
  equipment: EquipmentTag[];
  muscles: MuscleSpec[];
}

const WALK_TL = timeline([
  { d: 0.7, from: 0, to: 1, e: [0.75, 0.9] },
  { d: 0.7, from: 1, to: 0, e: [0.9, 0.75] },
]);
const HOLD_TL = timeline([
  { d: 1.2, from: 0, to: 1, e: [0.45, 0.9] },
  { d: 2.2, from: 1, to: 1, e: [0.9, 0.85] },
  { d: 1.2, from: 1, to: 0, e: [0.85, 0.45] },
]);

const meta = (o: StrongmanBase) => ({
  en: o.en, family: 'carry-strongman', equipment: o.equipment, sources: o.sources,
});
const mid = (a: Vec2, b: Vec2): Vec2 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const screen = (p: [number, number, number]): Vec2 => project(p);

/** Upright short-step gait. The moving foot lifts, while the planted foot remains flat. */
function gaitLegs(t: number, x = 250): Pose['legs'] {
  const s = Math.sin(Math.PI * 2 * t);
  const nearLift = 4 * Math.max(0, s), farLift = 4 * Math.max(0, -s);
  return {
    near: { target: [x + 7 * s, G - A - nearLift], side: [1, 0], foot: 0 },
    far: { target: [x - 7 * s, G - A - farLift], side: [1, 0], foot: 0 },
  };
}

function downArms(): Pose['arms'] {
  return {
    near: { target: (J) => [J.H[0] + 15, J.H[1] + 14], side: [-1, 0], hand: 90 },
    far: { target: (J) => add([J.H[0] + 15, J.H[1] + 14], sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
  };
}

function uprightCarryPose(t: number): Pose {
  return {
    hip: [250, 256], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    farHip: 0, legs: gaitLegs(t), arms: downArms(),
  };
}

const dumbbellShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'dumbbell-handle', color: pal.metalDark, c: [0, 18], s: [8, 27], r: 3 },
  { kind: 'box', nm: 'dumbbell-top', color: pal.plate, c: [0, 4], s: [29, 18], r: 5 },
  { kind: 'box', nm: 'dumbbell-bottom', color: pal.plate, c: [0, 32], s: [29, 18], r: 5 },
  { kind: 'box', nm: 'dumbbell-collar-top', color: pal.metal, c: [0, 11], s: [12, 4], r: 1 },
  { kind: 'box', nm: 'dumbbell-collar-bottom', color: pal.metal, c: [0, 25], s: [12, 4], r: 1 },
];

const farmerShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'farmer-handle', color: pal.metalDark, c: [0, 22], s: [10, 42], r: 3 },
  { kind: 'box', nm: 'farmer-load-top', color: pal.plate, c: [0, 45], s: [38, 13], r: 4 },
  { kind: 'box', nm: 'farmer-load-bottom', color: pal.plate, c: [0, 61], s: [38, 13], r: 4 },
  { kind: 'oval', nm: 'farmer-collar', color: pal.metal, c: [0, 35], s: [15, 8] },
];

const rigidAt = (nm: string, z: 'back' | 'front' | 'underNearArm' | 'overFarArm', shapes: (pal: Palette) => PropShape[], at: (J: Joints, t: number) => { p: Vec2; a?: number }) =>
  ({ kind: 'rigid' as const, nm, z, shapes, at });

export function dumbbellFarmersWalk(o: StrongmanBase): SideExercise {
  return {
    ...o, tl: WALK_TL, meta: meta(o), poster: 0.25,
    dynamic: [
      rigidAt('far dumbbell', 'back', dumbbellShapes, (J) => ({ p: [J.wrist_f[0], J.wrist_f[1] + 8] })),
      rigidAt('near dumbbell', 'front', dumbbellShapes, (J) => ({ p: [J.wrist_n[0], J.wrist_n[1] + 8] })),
    ],
    pose: uprightCarryPose,
  };
}

export function farmersWalk(o: StrongmanBase): SideExercise {
  return {
    ...o, tl: WALK_TL, meta: meta(o), poster: 0.25,
    dynamic: [
      rigidAt('far farmer handle', 'back', farmerShapes, (J) => ({ p: [J.wrist_f[0], J.wrist_f[1]] })),
      rigidAt('near farmer handle', 'front', farmerShapes, (J) => ({ p: [J.wrist_n[0], J.wrist_n[1]] })),
    ],
    pose: uprightCarryPose,
  };
}

export function overheadCarry(o: StrongmanBase): SideExercise {
  const pose = (t: number): Pose => ({
    hip: [250, 256], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    farHip: 0, legs: gaitLegs(t),
    arms: {
      near: { target: (J) => [J.S[0] + 5, J.S[1] - 125], side: [-1, 0], hand: -90 },
      far: { target: (J) => add([J.Hf[0] + 14, J.Hf[1] + 14], sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
    },
  });
  return {
    ...o, tl: WALK_TL, meta: meta(o), poster: 0.25,
    dynamic: [rigidAt('overhead dumbbell', 'front', dumbbellShapes, (J) => ({ p: [J.wrist_n[0], J.wrist_n[1] - 34] }))],
    pose,
  };
}

const yokeShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'yoke-crossbar', color: pal.metalDark, c: [0, -12], s: [150, 16], r: 5 },
  { kind: 'box', nm: 'yoke-near-post', color: pal.metal, c: [57, 94], s: [16, 205], r: 4 },
  { kind: 'box', nm: 'yoke-far-post', color: pal.metal, c: [-57, 94], s: [16, 205], r: 4 },
  { kind: 'box', nm: 'yoke-near-foot', color: pal.plate, c: [57, 194], s: [52, 12], r: 3 },
  { kind: 'box', nm: 'yoke-far-foot', color: pal.plate, c: [-57, 194], s: [52, 12], r: 3 },
];

export function yokeWalk(o: StrongmanBase): SideExercise {
  const pose = (t: number): Pose => ({
    hip: [250, 256], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    farHip: 0, legs: gaitLegs(t),
    arms: {
      near: { target: (J) => [J.S[0] - 38, J.S[1] + 36], side: [-1, 0], hand: 180 },
      far: { target: (J) => add([J.S[0] - 38, J.S[1] + 36], sub(J.Sf, J.S)), side: [-1, 0], hand: 180 },
    },
  });
  return {
    ...o, tl: WALK_TL, meta: meta(o), propsBox: [120, 390], poster: 0.25,
    dynamic: [rigidAt('shoulder yoke', 'back', yokeShapes, (J) => ({ p: [J.S[0], J.S[1] + 10] }))], pose,
  };
}

const rickshawShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'rickshaw-side-rail', color: pal.metalDark, c: [0, 59], s: [242, 16], r: 4 },
  { kind: 'box', nm: 'rickshaw-front-post', color: pal.metal, c: [102, 20], s: [16, 94], r: 4 },
  { kind: 'box', nm: 'rickshaw-back-post', color: pal.metal, c: [-102, 20], s: [16, 94], r: 4 },
  { kind: 'box', nm: 'rickshaw-grip', color: pal.metalDark, c: [18, -4], s: [64, 10], r: 4 },
  { kind: 'oval', nm: 'rickshaw-near-plate', color: pal.plate, c: [105, 47], s: [50, 50] },
  { kind: 'oval', nm: 'rickshaw-far-plate', color: pal.plate, c: [-105, 47], s: [50, 50] },
];

export function rickshawCarry(o: StrongmanBase): SideExercise {
  const pose = (t: number): Pose => ({
    hip: [250, 256], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    farHip: 0, legs: gaitLegs(t),
    arms: {
      near: { target: (J) => [J.H[0] + 24, J.H[1] + 14], side: [-1, 0], hand: 90 },
      far: { target: (J) => add([J.H[0] + 24, J.H[1] + 14], sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
    },
  });
  return {
    ...o, tl: WALK_TL, meta: meta(o), propsBox: [115, 390], poster: 0.25,
    dynamic: [rigidAt('rickshaw frame', 'back', rickshawShapes, (J) => ({ p: [J.H[0], J.H[1] + 4] }))], pose,
  };
}

const conanProps = (pal: Palette): { back: PropShape[] } => ({ back: [
  { kind: 'ring' as const, nm: 'wheel-pivot', color: pal.metalDark, c: [98, 285], s: [104, 104], w: 12 },
  { kind: 'box' as const, nm: 'wheel-pivot-post', color: pal.metal, c: [98, 387], s: [22, 124], r: 5 },
] });
const conanBeam = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'conan-beam', color: pal.metalDark, c: [-84, 0], s: [190, 18], r: 6 },
  { kind: 'box', nm: 'conan-load', color: pal.plate, c: [-164, 0], s: [37, 63], r: 6 },
  { kind: 'box', nm: 'zurcher-pad', color: pal.pad, c: [10, 0], s: [46, 24], r: 7 },
];

export function conansWheel(o: StrongmanBase): SideExercise {
  const pose = (t: number): Pose => ({
    hip: [266, 256], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    farHip: 0, legs: gaitLegs(t, 266),
    arms: {
      near: { target: (J) => [J.S[0] + 18, J.S[1] + 59], side: [-1, 0], hand: 180 },
      far: { target: (J) => add([J.S[0] + 18, J.S[1] + 59], sub(J.Sf, J.S)), side: [-1, 0], hand: 180 },
    },
  });
  return {
    ...o, tl: WALK_TL, meta: meta(o), props: conanProps, propsBox: [38, 395], poster: 0.25,
    dynamic: [rigidAt('conan wheel beam', 'underNearArm', conanBeam, (J) => ({ p: mid(J.wrist_n, J.wrist_f) }))], pose,
  };
}

const hammerShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'hammer-shaft', color: pal.metalDark, c: [0, -42], s: [10, 118], r: 4 },
  { kind: 'box', nm: 'hammer-head', color: pal.plate, c: [0, -104], s: [58, 25], r: 4 },
  { kind: 'box', nm: 'hammer-face-left', color: pal.metal, c: [-34, -104], s: [12, 18], r: 2 },
  { kind: 'box', nm: 'hammer-face-right', color: pal.metal, c: [34, -104], s: [12, 18], r: 2 },
];

export function crucifixHold(o: StrongmanBase): FrontExercise {
  return {
    ...o, view: 'front', tl: HOLD_TL, meta: meta(o),
    dynamic: [
      { kind: 'rigid', nm: 'left crucifix hammer', z: 'front', shapes: hammerShapes, at: (J: FrontJoints) => ({ p: add(screen(J.wrist_l), [0, 4]) }) },
      { kind: 'rigid', nm: 'right crucifix hammer', z: 'front', shapes: hammerShapes, at: (J: FrontJoints) => ({ p: add(screen(J.wrist_r), [0, 4]) }) },
    ],
    pose(t) {
      const u = HOLD_TL.at(t).p;
      return {
        pelvis: [0, BODY.ankleH + 183, 0],
        legs: { l: { target: [17, BODY.ankleH, 2] }, r: { target: [-17, BODY.ankleH, 2] } },
        arms: {
          // The hands begin beside the torso, then reach exactly to the horizontal judging line.
          l: { target: (J) => [J.shoulder_l[0] + lerp(22, 124, u), J.shoulder_l[1] - lerp(112, 0, u), J.shoulder_l[2]] },
          r: { target: (J) => [J.shoulder_r[0] - lerp(22, 124, u), J.shoulder_r[1] - lerp(112, 0, u), J.shoulder_r[2]] },
        },
      };
    },
  };
}

export function sledProps(x: number, facing: 'left' | 'right', pal: Palette): { back: PropShape[] } {
  const sign = facing === 'right' ? 1 : -1;
  return { back: [
    { kind: 'box', nm: 'sled-rail', color: pal.metalDark, c: [x, G - 17], s: [108, 10], r: 4 },
    { kind: 'box', nm: 'sled-crossbar', color: pal.metal, c: [x, G - 48], s: [78, 10], r: 4 },
    { kind: 'box', nm: 'sled-post-near', color: pal.metal, c: [x + sign * 27, G - 78], s: [10, 66], r: 3 },
    { kind: 'box', nm: 'sled-post-far', color: pal.metal, c: [x - sign * 27, G - 78], s: [10, 66], r: 3 },
    { kind: 'box', nm: 'sled-high-upright', color: pal.metal, c: [x - sign * 28, G - 156], s: [11, 154], r: 3 },
    { kind: 'box', nm: 'sled-high-handle', color: pal.metalDark, c: [x - sign * 28, G - 231], s: [49, 11], r: 4 },
    { kind: 'oval', nm: 'sled-load', color: pal.plate, c: [x, G - 65], s: [67, 28] },
  ] };
}

export function cable(nm: string, z: 'back' | 'front', from: Vec2, to: (J: Joints) => Vec2) {
  return { kind: 'line' as const, nm, z, width: 6, color: (pal: Palette) => pal.cable, at: (J: Joints) => [from, to(J)] as [Vec2, Vec2] };
}

/** Leaning forward, arms locked to the sled's high push handles. */
export function sledPush(o: StrongmanBase, sprint: boolean): SideExercise {
  const pose = (t: number): Pose => {
    const s = sprint ? Math.sin(Math.PI * 2 * t) : 0;
    const lift = sprint ? 8 * Math.max(0, s) : 0;
    return {
      hip: [215, 282], spine: { lumbar: -56, thoracic: -56 }, neck: -56, head: -56,
      farHip: 0,
      legs: sprint
        ? { near: { target: [211 + 12 * s, G - A - lift], side: [1, 0], foot: 0 }, far: { target: [211 - 12 * s, G - A - 8 * Math.max(0, -s)], side: [1, 0], foot: 0 } }
        : standLegs(211, 0),
      arms: {
        near: { target: [396, 226], side: [-1, 0], hand: 0 },
        far: { target: (J) => add([396, 226], sub(J.Sf, J.S)), side: [-1, 0], hand: 0 },
      },
    };
  };
  return { ...o, tl: WALK_TL, meta: meta(o), props: (pal) => sledProps(424, 'right', pal), propsBox: [130, 485], pose };
}

export function backwardSledDrag(o: StrongmanBase): SideExercise {
  const pose = (t: number): Pose => ({
    hip: [250, 256], spine: { lumbar: -110, thoracic: -110 }, neck: -108, head: -105,
    farHip: 0, legs: gaitLegs(t),
    arms: {
      near: { target: (J) => [J.S[0] + 25, J.S[1] + 54], side: [-1, 0], hand: 0 },
      far: { target: (J) => add([J.S[0] + 25, J.S[1] + 54], sub(J.Sf, J.S)), side: [-1, 0], hand: 0 },
    },
  });
  return {
    // The side rig faces right, so the sled is behind the athlete at screen left.
    ...o, tl: WALK_TL, meta: meta(o), props: (pal) => sledProps(90, 'left', pal), propsBox: [26, 390], poster: 0.25,
    dynamic: [cable('backward drag strap', 'back', [128, G - 93], (J) => mid(J.wrist_n, J.wrist_f))], pose,
  };
}

export function harnessSledDrag(o: StrongmanBase): SideExercise {
  const pose = (t: number): Pose => ({
    hip: [260, 275], spine: { lumbar: -64, thoracic: -64 }, neck: -64, head: -64,
    farHip: 0, legs: gaitLegs(t, 260), arms: downArms(),
  });
  return {
    ...o, tl: WALK_TL, meta: meta(o), props: (pal) => sledProps(81, 'left', pal), propsBox: [25, 390], poster: 0.25,
    dynamic: [cable('harness strap', 'back', [131, G - 93], (J) => [J.H[0] - 19, J.H[1] + 4])], pose,
  };
}

export function overheadBackwardSledDrag(o: StrongmanBase): SideExercise {
  const pose = (t: number): Pose => ({
    hip: [245, 256], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    farHip: 0, legs: gaitLegs(t, 245),
    arms: {
      near: { target: (J) => [J.S[0] + 4, J.S[1] - 125], side: [-1, 0], hand: -90 },
      far: { target: (J) => add([J.S[0] + 4, J.S[1] - 125], sub(J.Sf, J.S)), side: [-1, 0], hand: -90 },
    },
  });
  return {
    ...o, tl: WALK_TL, meta: meta(o), props: (pal) => sledProps(410, 'right', pal), propsBox: [100, 484], poster: 0.25,
    dynamic: [
      cable('far overhead strap', 'back', [375, G - 93], (J) => J.wrist_f),
      cable('near overhead strap', 'front', [375, G - 93], (J) => J.wrist_n),
    ], pose,
  };
}

export function forwardDragPress(o: StrongmanBase): SideExercise {
  const pose = (t: number): Pose => {
    const p = WALK_TL.at(t).p;
    return {
      hip: [256, 263], spine: { lumbar: -84, thoracic: -84 }, neck: -84, head: -84,
      farHip: 0, legs: gaitLegs(t, 256),
      arms: {
        near: { target: (J) => [J.S[0] + lerp(55, 121, p), J.S[1] + lerp(33, 12, p)], side: [-1, 0], hand: 0 },
        far: { target: (J) => add([J.S[0] + lerp(55, 121, p), J.S[1] + lerp(33, 12, p)], sub(J.Sf, J.S)), side: [-1, 0], hand: 0 },
      },
    };
  };
  return {
    ...o, tl: WALK_TL, meta: meta(o), props: (pal) => sledProps(78, 'left', pal), propsBox: [18, 435],
    dynamic: [
      cable('far press strap', 'back', [130, G - 93], (J) => J.wrist_f),
      cable('near press strap', 'front', [130, G - 93], (J) => J.wrist_n),
    ], pose,
  };
}

export function bearCrawlSledDrag(o: StrongmanBase): SideExercise {
  const pose = (t: number): Pose => {
    const s = Math.sin(Math.PI * 2 * t);
    const leg = (far: boolean): Pose['legs']['near'] => {
      const q = far ? -s : s;
      return { target: [QUAD.hip[0] - 63 + 12 * q, G - A - 6 * Math.max(0, q)] as Vec2, side: [-1, 0] as Vec2, foot: 180 };
    };
    return {
      hip: QUAD.hip, spine: QUAD.spine, neck: -10, head: -10, farHip: 0, farShoulder: 0,
      legs: { near: leg(false), far: leg(true) },
      arms: {
        near: { target: QUAD.wrist, side: [-1, 0], hand: 0 },
        far: { target: QUAD.wristFar, side: [-1, 0], hand: 0 },
      },
    };
  };
  return {
    ...o, tl: WALK_TL, meta: meta(o), props: (pal) => sledProps(72, 'left', pal), propsBox: [10, 390], poster: 0.25,
    dynamic: [cable('crawl harness strap', 'back', [124, G - 93], (J) => [J.H[0] - 15, J.H[1] + 3])], pose,
  };
}

// ---------- Strongman lifts and loading events ----------

const LIFT_TL = timeline([
  { d: 1.2, from: 0, to: 1, e: [0.35, 1] },
  { d: 0.3, from: 1, to: 1, e: [1, 0.88] },
  { d: 1.55, from: 1, to: 0, e: [0.82, 0.35] },
  { d: 0.35, from: 0, to: 0, e: [0.35, 0.35] },
]);

/** Conventional leg drive from an object on the floor. The object stays in the hands with a near-straight elbow. */
function floorPullPose(height: number, x = 250): Pose {
  const h = Math.max(38, Math.min(166, height));
  const u = (h - 38) / 128;
  const torso = lerp(-28, -91, u);
  const shoulderOffset = lerp(12, -12, u);
  const grip: Vec2 = [x + 20, G - h];
  const wrist: Vec2 = [grip[0], grip[1] - GRIP_IN_HAND];
  const dy = Math.sqrt(Math.max(1, ARM_STRAIGHT * ARM_STRAIGHT - shoulderOffset * shoulderOffset));
  const shoulder: Vec2 = [grip[0] + shoulderOffset, wrist[1] - dy];
  const spine = { lumbar: torso + 1, thoracic: torso - 1 };
  return {
    hip: hipForShoulder(shoulder, spine), spine, neck: torso + 3, head: torso + 1, farHip: 0,
    legs: standLegs(x, 0),
    arms: {
      near: { target: wrist, side: [-1, 0], hand: 90 },
      far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
    },
  };
}

function tallBody(dip = 0): Omit<Pose, 'arms'> {
  return {
    hip: [250, 256 + dip], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    farHip: 0, legs: standLegs(250, 0),
  };
}

function rackPose(dip = 0): Pose {
  return {
    ...tallBody(dip),
    arms: {
      near: { target: (J) => [J.S[0] + 49, J.S[1] - 15], side: [1, 0], hand: 0 },
      far: { target: (J) => [J.Sf[0] + 49, J.Sf[1] - 15], side: [1, 0], hand: 0 },
    },
  };
}

function singlePressPose(p: number, dip = 0): Pose {
  return {
    ...tallBody(dip),
    arms: {
      near: { target: (J) => [J.S[0] + lerp(49, 4, p), J.S[1] + lerp(-15, -125, p)], side: [1, 0], hand: -90 },
      far: { target: (J) => [J.Hf[0] + 14, J.Hf[1] + 15], side: [-1, 0], hand: 90 },
    },
  };
}

function doublePressPose(p: number, dip = 0): Pose {
  const arm = (far: boolean): Pose['arms']['near'] => ({
    target: (J) => {
      const S = far ? J.Sf : J.S;
      return [S[0] + lerp(49, 4, p), S[1] + lerp(-15, -125, p)];
    },
    side: [1, 0], hand: -90,
  });
  return { ...tallBody(dip), arms: { near: arm(false), far: arm(true) } };
}

const circusBellShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'circus-bell-handle', color: pal.metalDark, c: [0, 0], s: [17, 64], r: 7 },
  { kind: 'oval', nm: 'circus-bell-inner', color: pal.metal, c: [0, 0], s: [35, 22] },
  { kind: 'oval', nm: 'circus-bell-top', color: pal.plate, c: [0, -38], s: [92, 60] },
  { kind: 'oval', nm: 'circus-bell-bottom', color: pal.plate, c: [0, 38], s: [92, 60] },
];

const logShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'log-body', color: pal.propLight, c: [0, 0], s: [154, 66], r: 31 },
  { kind: 'oval', nm: 'log-near-end', color: pal.metalDark, c: [77, 0], s: [15, 62] },
  { kind: 'oval', nm: 'log-far-end', color: pal.metalDark, c: [-77, 0], s: [15, 62] },
  { kind: 'box', nm: 'log-inner-handle', color: pal.metalDark, c: [0, 0], s: [48, 12], r: 5 },
];

/** Oversized bell: two hands lift it to the shoulder, then one arm finishes a shallow-dip press. */
export function circusDumbbellCleanAndPress(o: StrongmanBase): SideExercise {
  return {
    ...o, tl: LIFT_TL, meta: meta(o), poster: 0.39,
    dynamic: [rigidAt('circus dumbbell', 'front', circusBellShapes, (J) => ({ p: J.wrist_n }))],
    pose(t) {
      const p = LIFT_TL.at(t).p;
      if (p < 0.34) return floorPullPose(lerp(42, 162, p / 0.34));
      if (p < 0.52) return rackPose(0);
      if (p < 0.62) return rackPose(15 * (p - 0.52) / 0.10);
      return singlePressPose((p - 0.62) / 0.38, 0);
    },
  };
}

/** Neutral-handle log clean and push press. The horizontal log stays between both hand targets. */
export function logCleanAndPress(o: StrongmanBase): SideExercise {
  return {
    ...o, tl: LIFT_TL, meta: meta(o), poster: 0.39,
    dynamic: [rigidAt('strongman log', 'underNearArm', logShapes, (J) => ({ p: mid(J.wrist_n, J.wrist_f) }))],
    pose(t) {
      const p = LIFT_TL.at(t).p;
      if (p < 0.36) return floorPullPose(lerp(42, 162, p / 0.36));
      if (p < 0.56) return rackPose(0);
      if (p < 0.66) return rackPose(15 * (p - 0.56) / 0.10);
      return doublePressPose((p - 0.66) / 0.34, 0);
    },
  };
}

const stoneShapes = (pal: Palette): PropShape[] => [
  { kind: 'oval', nm: 'atlas-stone', color: pal.plate, c: [0, -27], s: [96, 96] },
  { kind: 'oval', nm: 'atlas-stone-shade', color: pal.metalDark, c: [9, -19], s: [64, 66] },
];
const trainerShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'stone-trainer-pipe', color: pal.metalDark, c: [0, -22], s: [132, 20], r: 8 },
  { kind: 'oval', nm: 'stone-trainer-near-load', color: pal.plate, c: [60, -22], s: [38, 62] },
  { kind: 'oval', nm: 'stone-trainer-far-load', color: pal.plate, c: [-60, -22], s: [38, 62] },
  { kind: 'box', nm: 'stone-trainer-handle', color: pal.metal, c: [0, -5], s: [50, 12], r: 5 },
];

function lapHugPose(): Pose {
  return {
    hip: [224, 326], spine: { lumbar: -70, thoracic: -72 }, neck: -72, head: -74, farHip: 0,
    legs: standLegs(250, 0),
    arms: {
      near: { target: (J) => [J.S[0] + 58, J.S[1] + 71], side: [1, 0], hand: 0 },
      far: { target: (J) => [J.Sf[0] + 58, J.Sf[1] + 71], side: [1, 0], hand: 0 },
    },
  };
}

function chestHugPose(): Pose {
  return {
    ...tallBody(),
    arms: {
      near: { target: (J) => [J.S[0] + 53, J.S[1] + 39], side: [1, 0], hand: 0 },
      far: { target: (J) => [J.Sf[0] + 53, J.Sf[1] + 39], side: [1, 0], hand: 0 },
    },
  };
}

function handMid(J: Joints): Vec2 { return mid(J.wrist_n, J.wrist_f); }

/** Stone event: the object leaves the floor, rests in the lap, then ends high on the chest. */
export function atlasStoneLift(o: StrongmanBase, trainer = false): SideExercise {
  return {
    ...o, tl: LIFT_TL, meta: meta(o), poster: 0.39,
    dynamic: [rigidAt(trainer ? 'atlas stone trainer' : 'atlas stone', 'underNearArm', trainer ? trainerShapes : stoneShapes, (J) => ({ p: handMid(J) }))],
    pose(t) {
      const p = LIFT_TL.at(t).p;
      if (p < 0.34) return floorPullPose(lerp(43, 142, p / 0.34));
      if (p < 0.58) return lapHugPose();
      return chestHugPose();
    },
  };
}

const kegShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'keg-body', color: pal.metal, c: [0, 31], s: [73, 105], r: 28 },
  { kind: 'box', nm: 'keg-band-top', color: pal.metalDark, c: [0, -1], s: [75, 10], r: 3 },
  { kind: 'box', nm: 'keg-band-bottom', color: pal.metalDark, c: [0, 63], s: [75, 10], r: 3 },
  { kind: 'oval', nm: 'keg-end', color: pal.plate, c: [0, 84], s: [54, 13] },
];
const sandbagShapes = (pal: Palette): PropShape[] => [
  { kind: 'oval', nm: 'sandbag-body', color: pal.pad, c: [0, 28], s: [112, 78] },
  { kind: 'box', nm: 'sandbag-seam', color: pal.padFar, c: [0, 28], s: [78, 7], r: 3 },
  { kind: 'box', nm: 'sandbag-tie', color: pal.metalDark, c: [-49, 28], s: [10, 23], r: 4 },
];

function loadingPlatform(pal: Palette): { back: PropShape[] } {
  return { back: [
    { kind: 'box', nm: 'loading-platform-top', color: pal.metalDark, c: [414, 280], s: [151, 16], r: 4 },
    { kind: 'box', nm: 'loading-platform-front', color: pal.metal, c: [414, 366], s: [138, 166], r: 5 },
    { kind: 'box', nm: 'loading-platform-brace', color: pal.metalDark, c: [414, 438], s: [174, 11], r: 4 },
  ] };
}

function loadToPlatformPose(p: number): Pose {
  const lean = lerp(-90, -101, p);
  return {
    hip: [250, 256], spine: { lumbar: lean, thoracic: lean }, neck: lean, head: lean,
    farHip: 0, legs: standLegs(250, 0),
    arms: {
      near: { target: (J) => [J.S[0] + lerp(53, 106, p), J.S[1] + lerp(39, 58, p)], side: [1, 0], hand: 0 },
      far: { target: (J) => [J.Sf[0] + lerp(53, 106, p), J.Sf[1] + lerp(39, 58, p)], side: [1, 0], hand: 0 },
    },
  };
}

/** The event starts with a floor pickup, carries on the chest, and finishes against a raised loading platform. */
export function platformLoad(o: StrongmanBase, kind: 'keg' | 'sandbag'): SideExercise {
  const shapes = kind === 'keg' ? kegShapes : sandbagShapes;
  return {
    ...o, tl: LIFT_TL, meta: meta(o), props: loadingPlatform, propsBox: [172, 490], poster: 0.39,
    dynamic: [rigidAt(`${kind} load`, 'underNearArm', shapes, (J) => ({ p: handMid(J) }))],
    pose(t) {
      const p = LIFT_TL.at(t).p;
      if (p < 0.32) return floorPullPose(lerp(44, 140, p / 0.32));
      if (p < 0.58) return chestHugPose();
      return loadToPlatformPose((p - 0.58) / 0.42);
    },
  };
}

const stairsProps = (pal: Palette): { back: PropShape[] } => ({ back: [
  { kind: 'box', nm: 'stairs-low', color: pal.metalDark, c: [386, 420], s: [172, 38], r: 4 },
  { kind: 'box', nm: 'stairs-mid', color: pal.metal, c: [413, 386], s: [142, 34], r: 4 },
  { kind: 'box', nm: 'stairs-high', color: pal.metalDark, c: [440, 354], s: [112, 32], r: 4 },
] });
const powerStairsLoad = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'power-stairs-load', color: pal.plate, c: [0, 25], s: [75, 62], r: 8 },
  { kind: 'oval', nm: 'power-stairs-hub', color: pal.metal, c: [0, 25], s: [30, 30] },
];

function stairsPushPose(): Pose {
  return {
    hip: [244, 282], spine: { lumbar: -70, thoracic: -70 }, neck: -70, head: -70,
    farHip: 0, legs: standLegs(250, 0),
    arms: {
      near: { target: (J) => [J.S[0] + 70, J.S[1] + 95], side: [1, 0], hand: 0 },
      far: { target: (J) => [J.Sf[0] + 70, J.Sf[1] + 95], side: [1, 0], hand: 0 },
    },
  };
}

/** Both hands drive the weighted object from the floor onto a visibly stepped platform. */
export function powerStairs(o: StrongmanBase): SideExercise {
  return {
    ...o, tl: LIFT_TL, meta: meta(o), props: stairsProps, propsBox: [180, 500], poster: 0.39,
    dynamic: [rigidAt('power stairs load', 'underNearArm', powerStairsLoad, (J) => ({ p: handMid(J) }))],
    pose(t) {
      const p = LIFT_TL.at(t).p;
      return p < 0.45 ? floorPullPose(lerp(43, 105, p / 0.45)) : stairsPushPose();
    },
  };
}

const tireFlipShapes = (pal: Palette): PropShape[] => [
  { kind: 'ring', nm: 'tire-tread', color: pal.metalDark, c: [0, 0], s: [132, 164], w: 18 },
  { kind: 'ring', nm: 'tire-sidewall', color: pal.prop, c: [0, 0], s: [94, 126], w: 7 },
];

function tireFlipPose(p: number): Pose {
  if (p < 0.50) {
    const r = p / 0.50;
    return {
      hip: [lerp(238, 248, r), lerp(307, 278, r)], spine: { lumbar: lerp(-38, -61, r), thoracic: lerp(-40, -63, r) }, neck: -61, head: -64,
      farHip: 0, legs: standLegs(250, 0),
      arms: {
        near: { target: (J) => [J.S[0] + 48, J.S[1] + 92], side: [1, 0], hand: 0 },
        far: { target: (J) => [J.Sf[0] + 48, J.Sf[1] + 92], side: [1, 0], hand: 0 },
      },
    };
  }
  const r = (p - 0.50) / 0.50;
  return {
    hip: [250, lerp(278, 262, r)], spine: { lumbar: lerp(-61, -78, r), thoracic: lerp(-63, -80, r) }, neck: -78, head: -80,
    farHip: 0, legs: standLegs(250, 0),
    arms: {
      near: { target: (J) => [J.S[0] + 83, J.S[1] + lerp(76, 58, r)], side: [1, 0], hand: 0 },
      far: { target: (J) => [J.Sf[0] + 83, J.Sf[1] + lerp(76, 58, r)], side: [1, 0], hand: 0 },
    },
  };
}

/** The tire rises from its lower tread edge, then the athlete changes to a high push as it turns over. */
export function tireFlip(o: StrongmanBase): SideExercise {
  return {
    ...o, tl: LIFT_TL, meta: meta(o), propsBox: [160, 510], poster: 0.39,
    dynamic: [rigidAt('flipping tire', 'underNearArm', tireFlipShapes, (_J, t) => {
      const p = LIFT_TL.at(t).p;
      return { p: [lerp(365, 445, p), lerp(370, 383, p)], a: 90 * p };
    })],
    pose(t) { return tireFlipPose(LIFT_TL.at(t).p); },
  };
}

const slamHammerShapes = (pal: Palette): PropShape[] => [
  { kind: 'box', nm: 'sledge-shaft', color: pal.metalDark, c: [0, -40], s: [10, 112], r: 4 },
  { kind: 'box', nm: 'sledge-head', color: pal.plate, c: [0, -96], s: [60, 24], r: 4 },
  { kind: 'box', nm: 'sledge-face-left', color: pal.metal, c: [-35, -96], s: [12, 16], r: 2 },
  { kind: 'box', nm: 'sledge-face-right', color: pal.metal, c: [35, -96], s: [12, 16], r: 2 },
];

const slamTireProps = (pal: Palette): { back: PropShape[] } => ({ back: [
  { kind: 'ring', nm: 'slam-tire-tread', color: pal.metalDark, c: [404, G - 66], s: [132, 132], w: 18 },
  { kind: 'ring', nm: 'slam-tire-sidewall', color: pal.prop, c: [404, G - 66], s: [93, 93], w: 7 },
] });

function hammerSlamPose(p: number, staggered: boolean): Pose {
  const legs: Pose['legs'] = staggered
    ? { near: { target: [265, G - A], side: [1, 0], foot: 0 }, far: { target: [235, G - A], side: [1, 0], foot: 0 } }
    : standLegs(250, 0);
  if (p < 0.55) {
    const r = p / 0.55;
    const lean = lerp(-90, -67, r);
    return {
      hip: [250, lerp(256, 274, r)], spine: { lumbar: lean, thoracic: lean }, neck: lean, head: lean,
      farHip: 0, legs,
      arms: {
        near: { target: (J) => [J.S[0] + lerp(5, 25, r), J.S[1] + lerp(-124, 88, r)], side: [1, 0], hand: 0 },
        far: { target: (J) => [J.Sf[0] + lerp(5, 25, r), J.Sf[1] + lerp(-124, 88, r)], side: [1, 0], hand: 0 },
      },
    };
  }
  return {
    hip: [250, 274], spine: { lumbar: -67, thoracic: -67 }, neck: -67, head: -67, farHip: 0, legs,
    arms: {
      near: { target: (J) => [J.S[0] + 25, J.S[1] + 88], side: [1, 0], hand: 0 },
      far: { target: (J) => [J.Sf[0] + 25, J.Sf[1] + 88], side: [1, 0], hand: 0 },
    },
  };
}

/** Overhead-to-tire hammer strike. The tire version uses a staggered stance to distinguish its sliding-hand technique. */
export function sledgehammerSlam(o: StrongmanBase, staggered: boolean): SideExercise {
  return {
    ...o, tl: LIFT_TL, meta: meta(o), props: slamTireProps, propsBox: [165, 492], poster: 0.39,
    dynamic: [rigidAt('sledgehammer', 'front', slamHammerShapes, (J, t) => ({ p: handMid(J), a: 135 * LIFT_TL.at(t).p }))],
    pose(t) { return hammerSlamPose(LIFT_TL.at(t).p, staggered); },
  };
}
