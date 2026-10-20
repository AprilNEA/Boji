// Private builders for the horizontal-row-3 work list. Each builder keeps the torso
// fixed when a row needs a stable hinge or seat, and makes the implement follow the hands.
import type { EquipmentTag, Props, SideExercise } from '@/exercise.ts';
import { add, lerp, lerpV, smooth, timeline, type Vec2 } from '@/math.ts';
import type { Joints, Pose } from '@/rig.ts';
import { ARM_STRAIGHT, G, GRIP_IN_HAND, hipForShoulder, standLegs } from '@/exercises/common.ts';
import { pullUpBar } from '@/exercises/equipment/index.ts';

const rowTL = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.75, 1] },
  { d: 0.35, from: 1, to: 1, e: [0.75, 0.7] },
  { d: 1.6, from: 1, to: 0, e: [0.7, 0.45] },
  { d: 0.35, from: 0, to: 0, e: [0.25, 0.25] },
]);

export type RowMeta = {
  id: string;
  name: string;
  en: string;
  equipment: EquipmentTag[];
  sources: string[];
};

// This hinge gives 155° knees, 54° torso lean, and a 163° to 82° rowing elbow.
const BENT_HIP: Vec2 = [244, G - 192];
const BENT_GRIP_START: Vec2 = [363, G - 131];
const BENT_GRIP_END: Vec2 = [360, G - 174];
const LANDMINE_ANCHOR: Vec2 = [142, G - 9];

const bentGrip = (p: number) => lerpV(BENT_GRIP_START, BENT_GRIP_END, p);

function bentRowPose(p: number, single: boolean): Pose {
  const grip = bentGrip(p);
  return {
    hip: BENT_HIP,
    // The trunk stays 55 degrees from vertical; the hips and knees do not swing the load.
    spine: { lumbar: -35, thoracic: -36 }, neck: -35, head: -35,
    legs: standLegs(260, -6),
    arms: {
      near: { target: grip, side: [-1, 0], hand: -18 },
      far: single
        // This is the lower near thigh in profile. It reads as the customary bracing hand without overstretching the far arm.
        ? { target: (J) => add(J.Hf, [38, 45]), side: [-1, 0], hand: 65 }
        : { target: add(grip, [-4, -2]), side: [-1, 0], hand: -18 },
    },
  };
}

const landmineProps = (pal: Parameters<NonNullable<SideExercise['props']>>[0]): Props => ({
  back: [
    { kind: 'box' as const, nm: 'landmine-base', color: pal.metalDark, c: LANDMINE_ANCHOR, s: [34, 16], r: 7 },
    { kind: 'oval' as const, nm: 'landmine-pivot', color: pal.metal, c: LANDMINE_ANCHOR, s: [18, 18] },
  ],
});

/** A landmine shaft is a fixed-end bar. The loaded sleeve and handle travel with the wrist. */
export function makeLandmineRow(meta: RowMeta, opts: { single?: boolean; handle?: boolean }): SideExercise {
  const single = opts.single ?? false;
  return {
    ...meta,
    tl: rowTL,
    meta: { en: meta.en, family: 'horizontal-row', equipment: meta.equipment, sources: meta.sources },
    muscles: single
      ? [{ m: 'upperBack' }, { m: 'lats', side: 'near', scale: 0.55 }, { m: 'biceps', side: 'near', scale: 0.6 }, { m: 'forearms', side: 'near', scale: 0.35 }, { m: 'lowerBack', scale: 0.35 }]
      : [{ m: 'upperBack' }, { m: 'lats', scale: 0.6 }, { m: 'biceps', side: 'both', scale: 0.55 }, { m: 'forearms', side: 'both', scale: 0.35 }, { m: 'lowerBack', scale: 0.35 }],
    props: landmineProps,
    propsBox: [LANDMINE_ANCHOR[0] - 20, 438],
    dynamic: [
      {
        nm: 'Landmine shaft', z: 'back', kind: 'line', width: 8,
        color: (pal) => pal.metalDark,
        at: (_J, t) => [LANDMINE_ANCHOR, bentGrip(rowTL.at(t).p)],
      },
      {
        nm: opts.handle ? 'Neutral row handle' : 'Loaded sleeve', z: 'underNearArm', kind: 'rigid',
        shapes: (pal) => opts.handle
          ? [
              { kind: 'box', nm: 'double-d-handle', color: pal.metalDark, c: [0, 0], s: [14, 42], r: 6 },
              { kind: 'box', nm: 'grip', color: pal.padFar, c: [0, 0], s: [24, 11], r: 5 },
            ]
          : [
              { kind: 'box', nm: 'collar', color: pal.metal, c: [7, 0], s: [10, 30], r: 3 },
              { kind: 'oval', nm: 'small-plate', color: pal.propDark, c: [18, 0], s: [22, 55] },
              { kind: 'oval', nm: 'outer-plate', color: pal.metalDark, c: [26, 0], s: [12, 62] },
            ],
        at: (_J, t) => ({ p: bentGrip(rowTL.at(t).p), a: 0 }),
      },
    ],
    pose: (t) => bentRowPose(rowTL.at(t).p, single),
  } satisfies SideExercise;
}

const SMITH_LEFT = 416;
const SMITH_RIGHT = 454;

const smithProps = (pal: Parameters<NonNullable<SideExercise['props']>>[0]): Props => ({
  back: [
    { kind: 'box' as const, nm: 'smith-left-rail', color: pal.metal, c: [SMITH_LEFT, G - 176], s: [13, 344], r: 5 },
    { kind: 'box' as const, nm: 'smith-right-rail', color: pal.metalDark, c: [SMITH_RIGHT, G - 176], s: [13, 344], r: 5 },
    { kind: 'box' as const, nm: 'smith-base', color: pal.metalDark, c: [(SMITH_LEFT + SMITH_RIGHT) / 2, G - 5], s: [92, 12], r: 4 },
    { kind: 'box' as const, nm: 'smith-top', color: pal.metalDark, c: [(SMITH_LEFT + SMITH_RIGHT) / 2, G - 348], s: [92, 16], r: 5 },
  ],
});

/** Smith rows keep the bar guided vertically and keep the torso fixed near horizontal. */
export function makeSmithBentRow(meta: RowMeta, opts: { single?: boolean; underhand?: boolean; close?: boolean }): SideExercise {
  const single = opts.single ?? false;
  return {
    ...meta,
    tl: rowTL,
    meta: { en: meta.en, family: 'horizontal-row', equipment: meta.equipment, sources: meta.sources },
    muscles: single
      ? [{ m: 'upperBack' }, { m: 'lats', side: 'near', scale: 0.55 }, { m: 'biceps', side: 'near', scale: 0.65 }, { m: 'forearms', side: 'near', scale: 0.35 }, { m: 'lowerBack', scale: 0.35 }]
      : [{ m: 'upperBack' }, { m: 'lats', scale: 0.55 }, { m: 'biceps', side: 'both', scale: opts.underhand ? 0.75 : 0.55 }, { m: 'forearms', side: 'both', scale: 0.35 }, { m: 'lowerBack', scale: 0.35 }],
    props: smithProps,
    propsBox: [BENT_HIP[0] - 90, SMITH_RIGHT + 40],
    dynamic: [
      {
        nm: 'Smith bar', z: 'overFarArm', kind: 'line', width: 9,
        color: (pal) => pal.metalDark,
        at: (_J, t) => {
          const g = bentGrip(rowTL.at(t).p);
          return [[g[0] - (opts.close ? 58 : 80), g[1]], [SMITH_RIGHT + 15, g[1]]];
        },
      },
      {
        nm: 'Bar collar', z: 'underNearArm', kind: 'rigid',
        shapes: (pal) => [{ kind: 'box', nm: 'collar', color: pal.metal, c: [0, 0], s: [16, 18], r: 3 }],
        at: (_J, t) => ({ p: bentGrip(rowTL.at(t).p), a: 0 }),
      },
    ],
    pose: (t) => bentRowPose(rowTL.at(t).p, single),
  } satisfies SideExercise;
}

const SEAT_HIP: Vec2 = [190, G - 98];
const SEAT_ANKLE: Vec2 = [360, G - 107];
const SEAT_LEGS = {
  near: { target: SEAT_ANKLE, foot: -80, side: [0, -1] as Vec2 },
  far: { target: add(SEAT_ANKLE, [-4, 1]), foot: -80, side: [0, -1] as Vec2 },
};

type MachineOpts = {
  high?: boolean;
  single?: boolean;
  alternating?: boolean;
  chestPad?: boolean;
  close?: boolean;
  underhand?: boolean;
  forward?: boolean;
};

function handlePoint(S: Vec2, p: number, high: boolean): Vec2 {
  // The handles begin at about 168° elbow extension and end at 70–80° without moving the torso.
  return high
    ? [S[0] + lerp(56, 64, p), S[1] + lerp(-112, 34, p)]
    : [S[0] + lerp(123, 69, p), S[1] + lerp(24, 34, p)];
}

function seatedMachinePose(nearP: number, farP: number, opts: MachineOpts): Pose {
  const high = opts.high ?? false;
  const chestSupported = opts.chestPad ?? false;
  return {
    hip: SEAT_HIP,
    // A chest-supported row leans the sternum into the pad. A free close-grip row starts with a slight forward lean.
    spine: chestSupported ? { lumbar: -78, thoracic: -80 } : opts.forward ? { lumbar: -82, thoracic: -83 } : { lumbar: -96, thoracic: -97 },
    neck: chestSupported ? -80 : -92, head: chestSupported ? -80 : -90,
    legs: SEAT_LEGS,
    arms: {
      near: { target: (J) => handlePoint(J.S, nearP, high), side: [-0.5, 1], hand: opts.underhand ? 180 : 0 },
      far: opts.single
        ? { target: (J) => J.Hf, side: [-1, 0], hand: 55 }
        : { target: (J) => handlePoint(J.Sf, farP, high), side: [-0.5, 1], hand: opts.underhand ? 180 : 0 },
    },
  };
}

function machineProps(pal: Parameters<NonNullable<SideExercise['props']>>[0], opts: MachineOpts): Props {
  const high = opts.high ?? false;
  const pivotY = high ? G - 318 : G - 210;
  return {
    back: [
      { kind: 'box', nm: 'machine-base', color: pal.metalDark, c: [262, G - 5], s: [315, 12], r: 4 },
      { kind: 'box', nm: 'machine-column', color: pal.metal, c: [396, (G - 12 + pivotY) / 2], s: [20, G - pivotY - 8], r: 6 },
      { kind: 'box', nm: 'machine-top-beam', color: pal.metalDark, c: [292, pivotY], s: [226, 16], r: 6 },
      { kind: 'box', nm: 'seat-post', color: pal.metalDark, c: [190, G - 48], s: [14, 84], r: 4 },
      { kind: 'box', nm: 'seat', color: pal.pad, c: [197, SEAT_HIP[1] + 26], s: [104, 18], r: 8 },
      ...(!opts.chestPad ? [
        { kind: 'box' as const, nm: 'backrest-post', color: pal.metalDark, c: [128, G - 116] as Vec2, s: [13, 142] as Vec2, r: 4 },
        { kind: 'box' as const, nm: 'backrest', color: pal.pad, c: [145, G - 150] as Vec2, s: [22, 116] as Vec2, r: 9, rot: -8 },
      ] : []),
      { kind: 'box', nm: 'footplate-post', color: pal.metalDark, c: [337, G - 83], s: [12, 118], r: 4 },
      { kind: 'box', nm: 'footplate', color: pal.propDark, c: [348, SEAT_ANKLE[1]], s: [18, 74], r: 5, rot: 8 },
      { kind: 'oval', nm: 'lever-pivot', color: pal.metalDark, c: [396, pivotY], s: [26, 26] },
      ...(opts.chestPad ? [{ kind: 'box' as const, nm: 'chest-pad', color: pal.pad, c: [237, G - 191] as Vec2, s: [24, 86] as Vec2, r: 10, rot: -10 }] : []),
      ...(high ? [
        { kind: 'box' as const, nm: 'thigh-pad-post', color: pal.metalDark, c: [254, G - 117] as Vec2, s: [12, 96] as Vec2, r: 4 },
        { kind: 'box' as const, nm: 'thigh-pad', color: pal.pad, c: [250, G - 164] as Vec2, s: [80, 19] as Vec2, r: 8 },
      ] : []),
    ],
  };
}

/** Lever rows keep the pelvis on the seat. Each handle follows the wrist so it never drifts away from the hands. */
export function makeMachineRow(meta: RowMeta, opts: MachineOpts = {}): SideExercise {
  const nearProgress = (t: number) => rowTL.at(t).p;
  // A half-cycle offset makes alternating machines show one arm returning while the other pulls.
  const farProgress = (t: number) => opts.alternating ? rowTL.at((t + 0.5) % 1).p : nearProgress(t);
  const pivot: Vec2 = [396, opts.high ? G - 318 : G - 210];
  return {
    ...meta,
    tl: rowTL,
    meta: { en: meta.en, family: 'horizontal-row', equipment: meta.equipment, sources: meta.sources },
    muscles: opts.single
      ? [{ m: 'upperBack' }, { m: 'lats', side: 'near', scale: 0.65 }, { m: 'biceps', side: 'near', scale: 0.6 }, { m: 'forearms', side: 'near', scale: 0.35 }]
      : [{ m: 'upperBack' }, { m: 'lats', scale: 0.65 }, { m: 'biceps', side: 'both', scale: opts.underhand ? 0.7 : 0.55 }, { m: 'forearms', side: 'both', scale: 0.35 }],
    props: (pal) => machineProps(pal, opts),
    propsBox: [90, 440],
    dynamic: [
      {
        nm: 'Row lever', z: 'back', kind: 'line', width: 10,
        color: (pal) => pal.metalDark,
        at: (J) => [pivot, J.wrist_n],
      },
      ...(!opts.single ? [{
        nm: 'Far row lever', z: 'back' as const, kind: 'line' as const, width: 8,
        color: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => pal.metal,
        at: (J: Joints) => [add(pivot, [-5, -4]), J.wrist_f] as [Vec2, Vec2],
      }, {
        nm: 'Far row handle', z: 'overFarArm' as const, kind: 'rigid' as const,
        shapes: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => [{ kind: 'box' as const, nm: 'far-grip', color: pal.padFar, c: [0, 0] as Vec2, s: opts.close ? [10, 28] as Vec2 : [28, 10] as Vec2, r: 5 }],
        at: (J: Joints) => ({ p: J.wrist_f, a: 0 }),
      }] : []),
      {
        nm: opts.close ? 'Close neutral handle' : opts.underhand ? 'Supinated handle' : 'Row handle', z: 'underNearArm', kind: 'rigid',
        shapes: (pal) => opts.close
          ? [{ kind: 'box', nm: 'neutral-grip', color: pal.padFar, c: [0, 0], s: [12, 34], r: 6 }]
          : [{ kind: 'box', nm: 'grip', color: pal.padFar, c: [0, 0], s: [34, 12], r: 5 }],
        at: (J) => ({ p: J.wrist_n, a: 0 }),
      },
    ],
    pose: (t) => seatedMachinePose(nearProgress(t), farProgress(t), opts),
  } satisfies SideExercise;
}

/** Plate-loaded rows use the same fixed hinge as a free-weight row, with a machine lever at the hands. */
export function makeBentMachineRow(meta: RowMeta, opts: { chestSupport?: boolean; close?: boolean } = {}): SideExercise {
  const pivot: Vec2 = [406, G - 235];
  return {
    ...meta,
    tl: rowTL,
    meta: { en: meta.en, family: 'horizontal-row', equipment: meta.equipment, sources: meta.sources },
    muscles: [{ m: 'upperBack' }, { m: 'lats', scale: 0.6 }, { m: 'biceps', side: 'both', scale: 0.55 }, { m: 'forearms', side: 'both', scale: 0.35 }, { m: 'lowerBack', scale: 0.3 }],
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'machine-base', color: pal.metalDark, c: [316, G - 5], s: [260, 12], r: 4 },
        { kind: 'box', nm: 'machine-column', color: pal.metal, c: [406, G - 132], s: [20, 250], r: 6 },
        { kind: 'box', nm: 'machine-arm', color: pal.metalDark, c: [360, G - 232], s: [110, 15], r: 6 },
        { kind: 'oval', nm: 'lever-pivot', color: pal.metalDark, c: pivot, s: [27, 27] },
        ...(opts.chestSupport ? [
          { kind: 'box' as const, nm: 'incline-chest-pad', color: pal.pad, c: [332, G - 220] as Vec2, s: [28, 118] as Vec2, r: 11, rot: -35 },
          { kind: 'box' as const, nm: 'pad-support', color: pal.metalDark, c: [349, G - 155] as Vec2, s: [14, 174] as Vec2, r: 5, rot: -35 },
          { kind: 'box' as const, nm: 'foot-platform', color: pal.propDark, c: [267, G - 8] as Vec2, s: [132, 15] as Vec2, r: 4 },
        ] : []),
      ],
    }),
    propsBox: [150, 450],
    dynamic: [
      { nm: 'Plate-loaded lever', z: 'back', kind: 'line', width: 10, color: (pal) => pal.metalDark, at: (J) => [pivot, J.wrist_n] },
      { nm: 'Far plate-loaded lever', z: 'back', kind: 'line', width: 8, color: (pal) => pal.metal, at: (J) => [add(pivot, [-5, -4]), J.wrist_f] },
      {
        nm: opts.close ? 'V handle' : 'Lever handle', z: 'underNearArm', kind: 'rigid',
        shapes: (pal) => [{ kind: 'box', nm: 'grip', color: pal.padFar, c: [0, 0], s: opts.close ? [14, 38] : [36, 12], r: 6 }],
        at: (J) => ({ p: J.wrist_n, a: 0 }),
      },
    ],
    pose: (t) => bentRowPose(rowTL.at(t).p, false),
  } satisfies SideExercise;
}

const SUSPENSION_ANCHOR: Vec2 = [325, 108];

function suspensionPose(p: number, low: boolean): Pose {
  const hip = low ? lerpV([245, G - 103], [270, G - 121], p) : lerpV([260, G - 136], [284, G - 152], p);
  const spine = low
    ? { lumbar: lerp(-150, -140, p), thoracic: lerp(-151, -141, p) }
    : { lumbar: lerp(-130, -120, p), thoracic: lerp(-131, -121, p) };
  // The fixed handles give a 163–166° elbow at full reach and an 87–95° elbow at the chest.
  const handle: Vec2 = low ? [277, G - 182] : [318, G - 207];
  return {
    hip, spine, neck: spine.thoracic, head: spine.thoracic,
    legs: {
      near: { target: [395, G - 13], foot: 0, side: [0, -1] },
      far: { target: [389, G - 13], foot: 0, side: [0, -1] },
    },
    arms: {
      near: { target: handle, side: [-1, 0], hand: 0 },
      far: { target: add(handle, [-5, -4]), side: [-1, 0], hand: 0 },
    },
  };
}

/** The handles stay anchored at chest height; the straight body pivots toward them as the elbows flex. */
export function makeSuspensionRow(meta: RowMeta, opts: { low?: boolean } = {}): SideExercise {
  const low = opts.low ?? false;
  const handle: Vec2 = low ? [277, G - 182] : [318, G - 207];
  return {
    ...meta,
    tl: rowTL,
    meta: { en: meta.en, family: 'horizontal-row', equipment: meta.equipment, sources: meta.sources },
    muscles: [{ m: 'upperBack' }, { m: 'lats', scale: 0.6 }, { m: 'biceps', side: 'both', scale: 0.55 }, { m: 'abs', scale: 0.45 }],
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'suspension-anchor', color: pal.metalDark, c: SUSPENSION_ANCHOR, s: [74, 15], r: 6 },
        { kind: 'poly', nm: 'near-strap', color: pal.cable, pts: [[SUSPENSION_ANCHOR[0] - 14, SUSPENSION_ANCHOR[1] + 6], handle], w: 4, closed: false },
        { kind: 'poly', nm: 'far-strap', color: pal.cable, pts: [[SUSPENSION_ANCHOR[0] + 14, SUSPENSION_ANCHOR[1] + 6], add(handle, [-5, -4])], w: 4, closed: false },
        { kind: 'box', nm: 'near-handle', color: pal.padFar, c: handle, s: [25, 10], r: 4 },
        { kind: 'box', nm: 'far-handle', color: pal.padFar, c: add(handle, [-5, -4]), s: [23, 9], r: 4 },
      ],
    }),
    propsBox: [120, 425],
    pose: (t) => suspensionPose(rowTL.at(t).p, low),
  } satisfies SideExercise;
}

const STAND_HIP: Vec2 = [250, G - 178];
const STAND_START: Vec2 = [370, G - 266];
const STAND_END: Vec2 = [315, G - 258];

function standingRowPose(p: number, single: boolean): Pose {
  const grip = lerpV(STAND_START, STAND_END, p);
  return {
    hip: STAND_HIP, spine: { lumbar: -80, thoracic: -81 }, neck: -80, head: -80,
    legs: standLegs(260, -6),
    arms: {
      near: { target: grip, side: [-1, 0], hand: 0 },
      far: single ? { target: (J) => J.Hf, side: [-1, 0], hand: 55 } : { target: add(grip, [-5, -4]), side: [-1, 0], hand: 0 },
    },
  };
}

/** A high fixed rope stays taut while one arm rows it down and back toward the torso. */
export function makeRopeRow(meta: RowMeta): SideExercise {
  const anchor: Vec2 = [188, 88];
  return {
    ...meta,
    tl: rowTL,
    meta: { en: meta.en, family: 'horizontal-row', equipment: meta.equipment, sources: meta.sources },
    muscles: [{ m: 'upperBack' }, { m: 'biceps', side: 'near', scale: 0.6 }, { m: 'forearms', side: 'near', scale: 0.45 }, { m: 'delts', side: 'near', scale: 0.35 }, { m: 'abs', scale: 0.35 }],
    props: (pal) => ({ back: [
      { kind: 'box', nm: 'rope-anchor', color: pal.metalDark, c: anchor, s: [52, 16], r: 6 },
      { kind: 'oval', nm: 'rope-eye', color: pal.metal, c: anchor, s: [22, 22] },
    ] }),
    propsBox: [145, 405],
    dynamic: [{ nm: 'Anchored rope', z: 'back', kind: 'line', width: 7, color: (pal) => pal.cable, at: (J) => [anchor, J.wrist_n] }],
    pose: (t) => standingRowPose(rowTL.at(t).p, true),
  } satisfies SideExercise;
}

/** The loaded sled stays in front while both ropes shorten as the hands pull toward the torso. */
export function makeSledRow(meta: RowMeta): SideExercise {
  const hitch: Vec2 = [430, G - 116];
  return {
    ...meta,
    tl: rowTL,
    meta: { en: meta.en, family: 'horizontal-row', equipment: meta.equipment, sources: meta.sources },
    muscles: [{ m: 'upperBack' }, { m: 'lats', scale: 0.55 }, { m: 'biceps', side: 'both', scale: 0.55 }, { m: 'forearms', side: 'both', scale: 0.35 }, { m: 'quads', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: [
      { kind: 'box', nm: 'sled-base', color: pal.metalDark, c: [434, G - 14], s: [104, 18], r: 5 },
      { kind: 'box', nm: 'sled-post', color: pal.metal, c: [430, G - 76], s: [18, 110], r: 4, rot: -10 },
      { kind: 'oval', nm: 'sled-plate', color: pal.propDark, c: [449, G - 102], s: [52, 52] },
      { kind: 'oval', nm: 'sled-hitch', color: pal.metalDark, c: hitch, s: [18, 18] },
    ] }),
    propsBox: [160, 490],
    dynamic: [
      { nm: 'Near sled rope', z: 'back', kind: 'line', width: 5, color: (pal) => pal.cable, at: (J) => [hitch, J.wrist_n] },
      { nm: 'Far sled rope', z: 'back', kind: 'line', width: 5, color: (pal) => pal.cable, at: (J) => [add(hitch, [-4, -5]), J.wrist_f] },
    ],
    pose: (t) => standingRowPose(rowTL.at(t).p, false),
  } satisfies SideExercise;
}

/** A tucked bodyweight mid row keeps both pronated hands fixed and brings the tucked legs toward the bar. */
export function makeTuckedInvertedRow(meta: RowMeta): SideExercise {
  const barY = 104;
  const wrist: Vec2 = [254, barY + GRIP_IN_HAND];
  const station = pullUpBar({ view: 'side', x: wrist[0], y: barY });
  const spine = { lumbar: -120, thoracic: -120 };
  return {
    ...meta,
    tl: rowTL,
    meta: { en: meta.en, family: 'horizontal-row', equipment: meta.equipment, sources: meta.sources },
    muscles: [
      { m: 'upperBack' }, { m: 'lats', scale: 0.65 }, { m: 'biceps', side: 'both', scale: 0.6 },
      { m: 'forearms', side: 'both', scale: 0.35 }, { m: 'abs', scale: 0.5 }, { m: 'hipFlexor', side: 'both', scale: 0.35 },
    ],
    props: (pal) => ({ back: station.draw(pal) }),
    propsBox: [station.box[0], 390],
    pose: (t) => {
      const q = smooth(rowTL.at(t).p);
      // The bottom uses 0.7 px slack from straight reach. At the top the elbows are about 65°.
      const shoulder = lerpV([wrist[0], wrist[1] + ARM_STRAIGHT - 0.7], [265, 188], q);
      return {
        hip: hipForShoulder(shoulder, spine), spine, neck: -120, head: -120, farHip: 0,
        // The knees remain tucked in front of the trunk. The feet approach the upright at the contracted top.
        legs: {
          near: { a1: -70, a2: -155, foot: -155 },
          far: { a1: -69, a2: -154, foot: -154 },
        },
        arms: {
          near: { target: wrist, side: [-1, 0], hand: -90 },
          far: { target: (J) => add(wrist, [J.Sf[0] - J.S[0], J.Sf[1] - J.S[1]]), side: [-1, 0], hand: -90 },
        },
      };
    },
  } satisfies SideExercise;
}
