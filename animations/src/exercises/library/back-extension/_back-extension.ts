// Shared back-extension family poses. Hips or the torso stay on their support while the working segment moves.
// Side poses use straight, fixed leg directions when an ankle should remain at a pad, ball, or wall.
import type { FrontExercise, LibraryMeta, Props, SideExercise } from '@/exercise.ts';
import { add, ang, dir, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { add3, type Vec3 } from '@/math/vec3.ts';
import type { FrontJoints } from '@/rig/front.ts';
import type { Palette } from '@/draw/palettes.ts';
import type { Joints, Pose } from '@/rig/side.ts';
import { FLOOR, G } from '@/exercises/common.ts';
import { flatBench, heldPlate, stabilityBall, workTL } from '@/exercises/equipment/index.ts';

export type Details = Pick<SideExercise, 'id' | 'name'> & { meta: LibraryMeta };
export type FrontDetails = Pick<FrontExercise, 'id' | 'name'> & { meta: LibraryMeta };

const EXT_TL = workTL(0.45);
const BALL: Vec2 = [260, G - 68];
const WALL_X = 428;

const wall = (pal: Palette): Props => ({
  back: [
    { kind: 'box' as const, nm: 'wall', color: pal.propDark, c: [WALL_X + 10, 344], s: [20, 216], r: 3 },
    { kind: 'box' as const, nm: 'wall-edge', color: pal.metalDark, c: [WALL_X, 344], s: [3, 216], r: 1.5 },
  ],
});

/** Folded arms stay over the chest and do not become a floor contact. */
const crossedArms = () => ({
  near: {
    target: (J: Joints) => add(add(J.B(0.64), mul(J.A(0.64), 8)), [3, 3]),
    side: (J: Joints) => mul(J.A(0.64), -1),
    hand: (J: Joints) => ang(J.T(0.64)),
  },
  far: {
    target: (J: Joints) => add(add(J.B(0.64), mul(J.A(0.64), 8)), [-4, -1]),
    side: (J: Joints) => mul(J.A(0.64), -1),
    hand: (J: Joints) => ang(J.T(0.64)),
  },
});

const headArms = () => ({
  near: {
    target: (J: Joints) => add(add(J.N, mul(J.T(1), 20)), mul(J.A(1), 8)), side: (J: Joints) => mul(J.A(0.9), -1),
    hand: (J: Joints) => ang(J.T(1)),
  },
  far: {
    target: (J: Joints) => add(add(J.N, mul(J.T(1), 20)), mul(J.A(1), 4)), side: (J: Joints) => mul(J.A(0.9), -1),
    hand: (J: Joints) => ang(J.T(1)),
  },
});

/** A ball hyperextension has its hips on the crown of the ball and feet against a wall. */
function ballExtensionPose(p: number, arms: 'crossed' | 'extended' | 'head' | 'plate'): Pose {
  // 170° is the safely flexed bottom. 229° opposes the 49° legs at the straight top.
  const spineA = lerp(170, 229, p);
  const base = {
    // The hip joint sits above the ball crown. The pelvis, not the thigh, bears on the ball.
    hip: [260, 301] as Vec2,
    spine: { lumbar: spineA + 2, thoracic: spineA - 2 },
    neck: spineA - 1,
    head: spineA - 2,
    // Straight knees stay clear of the ball. The toe ends at the wall, rather than passing through it.
    legs: {
      near: { a1: 49, a2: 49, foot: 0 },
      far: { a1: 49, a2: 49, foot: 0 },
    },
  };
  if (arms === 'extended') {
    return {
      ...base,
      arms: {
        near: { a1: spineA, a2: spineA, hand: spineA },
        far: { a1: spineA, a2: spineA, hand: spineA },
      },
    };
  }
  if (arms === 'head') return { ...base, arms: headArms() };
  if (arms === 'plate') {
    return {
      ...base,
      arms: {
        near: {
          target: (J: Joints) => add(J.B(0.87), mul(J.A(0.87), 14)), side: (J: Joints) => mul(J.A(0.87), -1),
          hand: (J: Joints) => ang(J.T(0.87)),
        },
        far: {
          target: (J: Joints) => add(J.B(0.87), mul(J.A(0.87), 14)), side: (J: Joints) => mul(J.A(0.87), -1),
          hand: (J: Joints) => ang(J.T(0.87)),
        },
      },
    };
  }
  return { ...base, arms: crossedArms() };
}

export function ballBackExtension(d: Details, arms: 'crossed' | 'extended' | 'head' = 'crossed'): SideExercise {
  return {
    ...d,
    tl: EXT_TL,
    meta: d.meta,
    muscles: [{ m: 'lowerBack' }, { m: 'glutes', scale: 0.55 }, { m: 'hamstrings', side: 'both', scale: 0.4 }],
    props: wall,
    propsBox: [BALL[0] - 70, WALL_X + 22],
    dynamic: [stabilityBall<Joints>(() => ({ p: BALL }))],
    pose: (t) => ballExtensionPose(EXT_TL.at(t).p, arms),
  };
}

export function weightedBallBackExtension(d: Details): SideExercise {
  return {
    ...d,
    tl: EXT_TL,
    muscles: [{ m: 'lowerBack' }, { m: 'glutes', scale: 0.55 }, { m: 'hamstrings', side: 'both', scale: 0.4 }],
    props: wall,
    propsBox: [BALL[0] - 70, WALL_X + 22],
    dynamic: [
      stabilityBall<Joints>(() => ({ p: BALL })),
      // A medium plate stays immediately under the chin and follows the torso rather than the canvas.
      heldPlate<Joints>((J) => ({ p: add(J.B(0.91), mul(J.A(0.91), 18)), a: ang(J.T(0.91)) - 90 }), 'edge', 'medium', 'front'),
    ],
    pose: (t) => ballExtensionPose(EXT_TL.at(t).p, 'plate'),
  };
}

/** Reverse hypers keep the trunk quiet. Only the straight legs sweep up from a controlled hang. */
function reverseBallPose(p: number): Pose {
  const legA = lerp(38, -2, p);
  return {
    hip: [260, 330],
    spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
    legs: { near: { a1: legA, a2: legA, foot: 0 }, far: { a1: legA, a2: legA, foot: 0 } },
    arms: {
      near: { target: [102, FLOOR - 7], side: [0, 1], hand: 0 },
      far: { target: [108, FLOOR - 9], side: [0, 1], hand: 0 },
    },
  };
}

export function ballReverseHyper(d: Details): SideExercise {
  return {
    ...d,
    tl: EXT_TL,
    muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.65 }, { m: 'lowerBack', scale: 0.35 }],
    propsBox: [78, 492],
    dynamic: [stabilityBall<Joints>(() => ({ p: BALL }))],
    pose: (t) => reverseBallPose(EXT_TL.at(t).p),
  };
}

/** Feet begin on the ball. The straight legs lift away from its crown while both hands stay on the floor. */
export function ballProneLegRaise(d: Details): SideExercise {
  const footBall: Vec2 = [180, G - 136];
  return {
    ...d,
    tl: EXT_TL,
    mat: true,
    muscles: [{ m: 'glutes' }, { m: 'lowerBack', scale: 0.55 }, { m: 'abs', scale: 0.35 }],
    propsBox: [80, 510],
    dynamic: [stabilityBall<Joints>(() => ({ p: [150, G - 68] }))],
    pose: (t) => {
      // 198° reaches the ball crown. 225° raises the straight legs clear of it.
      const legA = lerp(198, 225, EXT_TL.at(t).p);
      return {
        hip: [360, 370],
        spine: { lumbar: -25, thoracic: -27 }, neck: -27, head: -25,
        legs: { near: { a1: legA, a2: legA, foot: 180 }, far: { a1: legA, a2: legA, foot: 180 } },
        arms: {
          near: { target: [438, FLOOR - 7], side: [-1, 0], hand: 0 },
          far: { target: [430, FLOOR - 9], side: [-1, 0], hand: 0 },
        },
      };
    },
  };
}

const FLAT = flatBench({ view: 'side', x: 190, top: 110, length: 230 });
const BENCH_HIP: Vec2 = [292, FLAT.seatY - 16];

function benchReversePose(a: number): Pose {
  return {
    hip: BENCH_HIP,
    spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
    legs: { near: { a1: a, a2: a, foot: 0 }, far: { a1: a, a2: a, foot: 0 } },
    arms: {
      near: { target: [130, FLAT.seatY - 7], side: [0, 1], hand: 180 },
      far: { target: [136, FLAT.seatY - 9], side: [0, 1], hand: 180 },
    },
  };
}

export function benchReverseHyper(d: Details): SideExercise {
  return {
    ...d,
    tl: EXT_TL,
    muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.65 }, { m: 'lowerBack', scale: 0.35 }],
    props: (pal) => ({ back: FLAT.draw(pal) }),
    propsBox: FLAT.box,
    pose: (t) => benchReversePose(lerp(40, -3, EXT_TL.at(t).p)),
  };
}

/** Controlled flutter with the torso fixed on the bench and both knees fully extended. */
export function benchFlutter(d: Details): SideExercise {
  return {
    ...d,
    tl: { total: 1.2 },
    muscles: [
      { m: 'glutes', e: () => 0.85 },
      { m: 'hamstrings', side: 'near', scale: 0.6, e: (t) => 0.35 + 0.65 * Math.max(0, Math.sin(Math.PI * 2 * t)) },
      { m: 'hamstrings', side: 'far', scale: 0.6, e: (t) => 0.35 + 0.65 * Math.max(0, -Math.sin(Math.PI * 2 * t)) },
    ],
    props: (pal) => ({ back: FLAT.draw(pal) }),
    propsBox: FLAT.box,
    pose: (t) => {
      const wave = Math.sin(Math.PI * 2 * t);
      return benchReversePose(0) && {
        ...benchReversePose(0),
        legs: {
          near: { a1: -5 - 17 * wave, a2: -5 - 17 * wave, foot: 0 },
          far: { a1: -5 + 17 * wave, a2: -5 + 17 * wave, foot: 0 },
        },
      };
    },
  };
}

const ROMAN_HIP: Vec2 = [270, 305];
const romanProps = (pal: Palette): Props => ({
  back: [
    { kind: 'box' as const, nm: 'roman-base', color: pal.metalDark, c: [224, G - 5], s: [190, 10], r: 3 },
    { kind: 'box' as const, nm: 'roman-upright', color: pal.metal, c: [240, 365], s: [14, 156], r: 6, rot: 22 },
    { kind: 'box' as const, nm: 'hip-pad', color: pal.pad, c: [270, 320], s: [96, 24], r: 9 },
    { kind: 'box' as const, nm: 'foot-rail', color: pal.metalDark, c: [169, 406], s: [106, 10], r: 4, rot: -39 },
    { kind: 'oval' as const, nm: 'near-ankle-pad', color: pal.pad, c: [139, 424], s: [30, 30] },
    { kind: 'oval' as const, nm: 'far-ankle-pad', color: pal.padFar, c: [157, 409], s: [27, 27] },
  ],
});

function romanPose(p: number): Pose {
  // A chest-down pose faces right: the lowered torso is 35°, then it rises to -40° in line with the secured legs.
  const spineA = lerp(35, -40, p);
  return {
    hip: ROMAN_HIP,
    spine: { lumbar: spineA + 2, thoracic: spineA - 2 }, neck: spineA - 1, head: spineA - 2,
    legs: { near: { a1: 141, a2: 141, foot: 180 }, far: { a1: 141, a2: 141, foot: 180 } },
    arms: crossedArms(),
  };
}

export function romanBackExtension(d: Details): SideExercise {
  return {
    ...d,
    tl: EXT_TL,
    muscles: [{ m: 'lowerBack' }, { m: 'glutes', scale: 0.55 }, { m: 'hamstrings', side: 'both', scale: 0.45 }],
    props: romanProps,
    propsBox: [120, 370],
    pose: (t) => romanPose(EXT_TL.at(t).p),
  };
}

/** Prone floor pose. The chest lifts without a hand contact and the neck follows the upper back. */
function proneFloorPose(p: number, arms: 'sides' | 'forward', legsLift: number): Pose {
  const spineA = lerp(0, -22, p);
  const legA = lerp(180, 180 + legsLift, p);
  const base = {
    hip: [225, FLOOR - 27] as Vec2,
    spine: { lumbar: spineA + 1, thoracic: spineA - 1 }, neck: spineA - 3, head: spineA - 1,
    legs: { near: { a1: legA, a2: legA, foot: 180 }, far: { a1: legA, a2: legA, foot: 180 } },
  };
  if (arms === 'forward') {
    return {
      ...base,
      arms: {
        near: { a1: spineA, a2: spineA, hand: spineA },
        far: { a1: spineA, a2: spineA, hand: spineA },
      },
    };
  }
  return {
    ...base,
    arms: {
      near: { target: (J: Joints) => add(J.B(0.42), mul(J.A(0.42), -26)), side: (J: Joints) => mul(J.A(0.42), 1), hand: 180 },
      far: { target: (J: Joints) => add(J.B(0.42), mul(J.A(0.42), -18)), side: (J: Joints) => mul(J.A(0.42), 1), hand: 180 },
    },
  };
}

export function proneBackExtension(d: Details): SideExercise {
  return {
    ...d,
    tl: EXT_TL,
    mat: true,
    muscles: [{ m: 'lowerBack' }, { m: 'glutes', scale: 0.45 }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
    pose: (t) => {
      const pose = proneFloorPose(EXT_TL.at(t).p, 'sides', 0);
      // The side rig's head extends below its neck joint. Raise the floor pose by 12 px so the face never clips.
      return { ...pose, hip: [pose.hip[0], pose.hip[1] - 12] };
    },
  };
}

export function superman(d: Details): SideExercise {
  return {
    ...d,
    tl: EXT_TL,
    mat: true,
    muscles: [{ m: 'lowerBack' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.5 }],
    pose: (t) => proneFloorPose(EXT_TL.at(t).p, 'forward', 18),
  };
}

export function proneFlutter(d: Details): SideExercise {
  return {
    ...d,
    tl: { total: 1.2 },
    mat: true,
    muscles: [
      { m: 'glutes', e: () => 0.85 },
      { m: 'hamstrings', side: 'near', scale: 0.65, e: (t) => 0.3 + 0.7 * Math.max(0, Math.sin(Math.PI * 2 * t)) },
      { m: 'hamstrings', side: 'far', scale: 0.65, e: (t) => 0.3 + 0.7 * Math.max(0, -Math.sin(Math.PI * 2 * t)) },
      { m: 'lowerBack', scale: 0.45, e: () => 0.65 },
    ],
    pose: (t) => {
      const wave = Math.sin(Math.PI * 2 * t);
      const pose = proneFloorPose(0.78, 'forward', 0);
      return {
        ...pose,
        legs: {
          near: { a1: 196 + 16 * wave, a2: 196 + 16 * wave, foot: 180 },
          far: { a1: 196 - 16 * wave, a2: 196 - 16 * wave, foot: 180 },
        },
      };
    },
  };
}

const MACHINE_HIP: Vec2 = [282, 300];
const machineReverseProps = (pal: Palette): Props => ({
  back: [
    { kind: 'box' as const, nm: 'machine-base', color: pal.metalDark, c: [268, G - 5], s: [268, 10], r: 3 },
    { kind: 'box' as const, nm: 'machine-post', color: pal.metal, c: [248, 378], s: [16, 138], r: 6 },
    { kind: 'box' as const, nm: 'machine-top-pad', color: pal.pad, c: [210, 316], s: [190, 25], r: 9 },
    { kind: 'box' as const, nm: 'machine-handle', color: pal.padFar, c: [135, 304], s: [40, 10], r: 5 },
    { kind: 'box' as const, nm: 'machine-foot-rail', color: pal.metalDark, c: [358, 376], s: [178, 12], r: 6 },
  ],
});

export function machineReverseHyper(d: Details): SideExercise {
  return {
    ...d,
    tl: EXT_TL,
    muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.65 }, { m: 'lowerBack', scale: 0.35 }],
    props: machineReverseProps,
    propsBox: [104, 460],
    dynamic: [{
      nm: 'Foot Cradle', z: 'back', kind: 'rigid',
      shapes: (pal) => [
        { kind: 'box', nm: 'cradle-bar', color: pal.metal, c: [0, 0], s: [54, 10], r: 5 },
        { kind: 'oval', nm: 'near-foot-pad', color: pal.pad, c: [22, 0], s: [28, 28] },
        { kind: 'oval', nm: 'far-foot-pad', color: pal.padFar, c: [-22, 0], s: [28, 28] },
      ],
      at: (J) => ({ p: J.ankle_n, a: J.shin_n.a }),
    }],
    pose: (t) => {
      const a = lerp(36, -3, EXT_TL.at(t).p);
      return {
        hip: MACHINE_HIP,
        spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
        legs: { near: { a1: a, a2: a, foot: 0 }, far: { a1: a, a2: a, foot: 0 } },
        arms: {
          near: { target: [136, 303], side: [0, 1], hand: 180 },
          far: { target: [142, 301], side: [0, 1], hand: 180 },
        },
      };
    },
  };
}

const SEAT_HIP: Vec2 = [215, G - 104];
const seatedMachineProps = (pal: Palette): Props => ({
  back: [
    { kind: 'box' as const, nm: 'machine-base', color: pal.metalDark, c: [253, G - 5], s: [220, 10], r: 3 },
    { kind: 'box' as const, nm: 'seat-post', color: pal.metal, c: [225, 402], s: [14, 86], r: 6 },
    { kind: 'box' as const, nm: 'seat', color: pal.pad, c: [228, 365], s: [108, 18], r: 8 },
    { kind: 'box' as const, nm: 'foot-post', color: pal.metal, c: [332, 398], s: [14, 92], r: 5 },
    { kind: 'box' as const, nm: 'foot-plate', color: pal.metalDark, c: [324, 427], s: [16, 62], r: 5, rot: 8 },
    { kind: 'box' as const, nm: 'handle-rail', color: pal.metalDark, c: [264, 283], s: [52, 10], r: 5 },
  ],
});

export function seatedBackExtension(d: Details): SideExercise {
  return {
    ...d,
    tl: EXT_TL,
    muscles: [{ m: 'lowerBack' }, { m: 'glutes', scale: 0.35 }, { m: 'hamstrings', side: 'both', scale: 0.3 }],
    props: seatedMachineProps,
    propsBox: [166, 366],
    dynamic: [{
      nm: 'Back Pad', z: 'back', kind: 'rigid',
      shapes: (pal) => [{ kind: 'box', nm: 'back-pad', color: pal.pad, c: [0, 0], s: [20, 122], r: 9 }],
      at: (J, t) => ({ p: add(J.B(0.55), mul(J.A(0.55), -20)), a: ang(J.T(0.55)) - 90 }),
    }],
    pose: (t) => {
      // The lower back flexes more than the upper back. The return ends tall, without a lumbar arch.
      const p = EXT_TL.at(t).p;
      return {
        hip: SEAT_HIP,
        spine: { lumbar: lerp(-57, -96, p), thoracic: lerp(-69, -98, p) },
        neck: lerp(-64, -92, p), head: lerp(-67, -92, p),
        legs: {
          near: { target: [315, G - 13], side: [0, -1], foot: 0 },
          far: { target: [309, G - 13], side: [0, -1], foot: 0 },
        },
        arms: {
          near: { target: [263, 282], side: [-1, 0.2], hand: 0 },
          far: { target: [258, 280], side: [-1, 0.2], hand: 0 },
        },
      };
    },
  };
}

const ROTATE_TL = timeline([
  { d: 1.0, from: 0, to: 1, e: [0.35, 1] },
  { d: 0.3, from: 1, to: 1, e: [1, 0.95] },
  { d: 0.5, from: 1, to: 1, e: [0.9, 0.85] },
  { d: 0.5, from: 1, to: 1, e: [0.85, 0.85] },
  { d: 0.5, from: 1, to: 1, e: [0.85, 0.8] },
  { d: 1.6, from: 1, to: 0, e: [0.8, 0.4] },
  { d: 0.45, from: 0, to: 0, e: [0.4, 0.3] },
]);

function twistAt(t: number): number {
  const s = t * ROTATE_TL.total;
  if (s < 1.3 || s >= 2.8) return 0;
  if (s < 1.8) return 30 * ((s - 1.3) / 0.5);
  if (s < 2.3) return 30 - 60 * ((s - 1.8) / 0.5);
  return -30 + 30 * ((s - 2.3) / 0.5);
}

/** Front view makes the controlled left and right trunk rotation visible after the extension. */
export function ballExtensionRotation(d: FrontDetails): FrontExercise {
  return {
    ...d,
    view: 'front',
    tl: ROTATE_TL,
    muscles: [{ m: 'abs', scale: 0.65 }, { m: 'obliques', scale: 0.8 }, { m: 'glutes', scale: 0.35, region: { view: 'front', part: 'pelvis', c: [17, 1], s: [18, 21], mirror: true } }],
    propsBox: [178, 334],
    dynamic: [stabilityBall<FrontJoints>(() => ({ p: [256, G - 68] }))],
    pose: (t) => {
      const p = ROTATE_TL.at(t).p;
      const pitch = lerp(38, 0, p);
      const twist = twistAt(t);
      const foot = (side: 1 | -1): Vec3 => [44 * side, 13, -135];
      return {
        pelvis: [0, 130, 0],
        hips: { pitch: lerp(25, 5, p) },
        spine: { pitch, yaw: twist },
        neck: { pitch: -5 },
        head: { pitch: -4 },
        legs: { l: { target: foot(1) }, r: { target: foot(-1) } },
        arms: {
          l: { target: (J) => add3(J.E, [32, 2, 8]), pole: [1, 0, 0] },
          r: { target: (J) => add3(J.E, [-32, 2, 8]), pole: [-1, 0, 0] },
        },
      };
    },
  };
}
