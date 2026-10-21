// Private builders for the calf-raise-2 work list. The ball of each working foot stays on its support while the
// ankle moves. Standing versions rise as a whole with straight knees; seated and leg-press versions keep the knees
// fixed. The machine drawings show the support point that makes each variation recognizable.
import type { MovingPart, Props } from '@/exercise.ts';
import { add, dir, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import { BODY, solve, type Joints, type LimbPair, type Pose } from '@/rig/side.ts';
import { A, G } from '@/exercises/common.ts';
import {
  aerobicStep, backrestAt, baseRail, barbell, dumbbell, footPlate, gripAt, pad, seatPad, smithRails,
  stabilityBall, tube, weightStack, workTL,
} from '@/exercises/equipment/index.ts';

export const calfTL = workTL(0.45);
export const X = 270;
export const FOOT_MAX = 34;

/** Ankle translation and height when the ball of a 53 px foot stays at its support point. */
export function overBall(a: number): { dx: number; h: number } {
  const r = a * Math.PI / 180;
  return { dx: 40 - (40 * Math.cos(r) - 13 * Math.sin(r)), h: 40 * Math.sin(r) + 13 * Math.cos(r) };
}

const hangingArms = {
  near: { a1: 90, a2: 90, hand: 90 },
  far: { a1: 90, a2: 90, hand: 90 },
};

/** Upright calf raise. The body rises with the heels, while the forefeet remain on the support. */
export function standingPose(p: number, arms: Pose['arms'] = hangingArms, single = false): Pose {
  const a = FOOT_MAX * p;
  const { dx, h } = overBall(a);
  return {
    // 183.8 px hip-to-ankle distance leaves less than 0.2 px of slack: knees stay nearly straight.
    hip: [X - 2 + dx, G - A - 183.8 - (h - A)],
    spine: { lumbar: -89, thoracic: -91 }, neck: -86, head: -88,
    legs: {
      near: { target: [X + dx, G - h], foot: a, side: [1, 0] },
      // The free leg is flexed behind the body for a one-leg variation.
      far: single
        ? { a1: 112, a2: 220, foot: 8 }
        : { target: [X - 6 + dx, G - h], foot: a, side: [1, 0] },
    },
    arms,
  };
}

/** Heel-supported reverse calf raise. The step supports the heels while the forefeet pull upward. */
export function tibialisPose(p: number, arms: Pose['arms'] = hangingArms): Pose {
  const support = 31;
  const ankleLift = 7 * p;
  return {
    hip: [X - 2, G - A - 183.8 - support - ankleLift], spine: { lumbar: -89, thoracic: -91 }, neck: -86, head: -88,
    legs: {
      near: { target: [X, G - A - support - ankleLift], foot: -27 * p, side: [1, 0] },
      far: { target: [X - 6, G - A - support - ankleLift], foot: -27 * p, side: [1, 0] },
    },
    arms,
  };
}

export const dumbbellDynamics = [dumbbell('f', 'profile'), dumbbell('n', 'profile')];

/** Back against a wall ball. The ball stays behind the lower back while it rolls upward with the body. */
export function wallBallProps(): Props {
  return {
    back: [
      { kind: 'box', nm: 'wall', color: '#C8CDD4', c: [108, 245], s: [18, 330], r: 3 },
      { kind: 'box', nm: 'wall-base', color: '#AEB5BF', c: [124, G - 5], s: [48, 10], r: 3 },
    ],
  };
}
export const wallBallDynamic: MovingPart[] = [
  stabilityBall<Joints>((J) => ({ p: [J.B(0.22)[0] - 83, J.B(0.22)[1]] }), 'back'),
];

/** Small ball squeezed between the ankles. */
export const ankleBall: MovingPart = {
  nm: 'Ankle Ball', kind: 'rigid', z: 'front',
  shapes: (pal) => [{ kind: 'oval', nm: 'tennis-ball', color: pal.medBall, c: [0, 0], s: [22, 22] }],
  at: (J) => ({ p: [(J.ankle_n[0] + J.ankle_f[0]) / 2 - 5, (J.ankle_n[1] + J.ankle_f[1]) / 2 - 9] }),
};

const pressBase = (() => {
  const hip: Vec2 = [154, G - 128];
  const feet: LimbPair = {
    near: { target: [320, G - 164], foot: -98, side: [0, -1] },
    far: { target: [316, G - 165], foot: -98, side: [0, -1] },
  };
  const upper = { hip, spine: { lumbar: -116, thoracic: -118 }, neck: -108, head: -101 };
  const probe = solve({ ...upper, legs: feet, arms: hangingArms });
  return { hip, feet, upper, probe, rest: backrestAt(probe, 0.54, 9, [18, 170], 18) };
})();

/** Reclined leg press: knees stay almost straight and the feet plantar-flex against the plate. */
export function legPressPose(p: number, single = false): Pose {
  const foot = lerp(-98, -74, p);
  const legs: LimbPair = {
    near: { target: [320, G - 164], foot, side: [0, -1] },
    far: single
      ? { a1: 100, a2: 205, foot: 4 }
      : { target: [316, G - 165], foot, side: [0, -1] },
  };
  return {
    ...pressBase.upper, legs,
    arms: {
      near: { target: [184, G - 122], side: [-1, 0.2], hand: 0 },
      far: { target: [181, G - 124], side: [-1, 0.2], hand: 0 },
    },
  };
}

export function legPressProps(kind: 'angled' | 'horizontal' | 'lying' = 'angled'): Props {
  const stack = weightStack({ x: 82, top: 86, lift: () => 0 });
  const plate = kind === 'horizontal' ? [343, G - 159] as Vec2 : [344, G - 176] as Vec2;
  const rot = kind === 'horizontal' ? 0 : -12;
  return {
    back: [
      ...stack.fixed({} as never),
    ],
  };
}

// `weightStack` needs a palette at render time. This factory keeps the leg press geometric frame in one place.
export function legPressMachineProps(kind: 'angled' | 'horizontal' | 'lying' = 'angled'): (pal: Parameters<typeof footPlate>[0]) => Props {
  return (pal) => {
    const stack = weightStack({ x: 82, top: 86, lift: () => 0 });
    const plateC: Vec2 = kind === 'horizontal' ? [344, G - 160] : [344, G - 176];
    const rot = kind === 'horizontal' ? 0 : -12;
    return { back: [
      ...stack.fixed(pal),
      baseRail(pal, 48, 392),
      tube(pal, 'rear-rail', [112, G - 70], [310, G - 225], { w: 13 }),
      tube(pal, 'front-rail', [135, G - 64], [330, G - 210], { w: 13, dark: true }),
      tube(pal, 'seat-post', [154, G - 5], [154, G - 100], { dark: true, w: 16 }),
      tube(pal, 'plate-carriage', [330, G - 210], plateC, { w: 16 }),
      pad(pal, 'backrest', pressBase.rest.c, pressBase.rest.size, pressBase.rest.rot),
      seatPad(pal, 168, G - 103, 96),
      footPlate(pal, 'footplate', plateC, [13, 116], rot),
      { kind: 'box', nm: 'side-handle', color: pal.padFar, c: [185, G - 126], s: [34, 10], r: 5 },
    ] };
  };
}

/** Seated calf machine. The knees stay fixed while each forefoot rolls along the vertical plate. */
export function seatedPose(p: number, single = false): Pose {
  const hip: Vec2 = [175, G - 104];
  const ankle: Vec2 = [294, G - 100];
  const foot = lerp(-8, -32, p);
  return {
    hip, spine: { lumbar: -97, thoracic: -101 }, neck: -93, head: -90,
    legs: {
      near: { target: ankle, foot, side: [0, -1] },
      far: single ? { a1: 95, a2: 205, foot: 5 } : { target: [ankle[0] - 4, ankle[1] + 1], foot, side: [0, -1] },
    },
    arms: {
      near: { target: [199, G - 116], side: [-1, 0.3], hand: 0 },
      far: { target: [196, G - 118], side: [-1, 0.3], hand: 0 },
    },
  };
}

export function seatedMachineProps(padOverKnees = true): (pal: Parameters<typeof footPlate>[0]) => Props {
  return (pal) => ({ back: [
    baseRail(pal, 88, 350),
    tube(pal, 'back-post', [130, G - 5], [130, G - 196], { dark: true, w: 15 }),
    tube(pal, 'seat-post', [181, G - 5], [181, G - 92], { dark: true, w: 15 }),
    tube(pal, 'footplate-post', [324, G - 5], [324, G - 106], { w: 15 }),
    pad(pal, 'backrest', [132, G - 176], [18, 152], -8),
    seatPad(pal, 184, G - 88, 104),
    footPlate(pal, 'toe-platform', [319, G - 97], [11, 92], 0),
    ...(padOverKnees ? [pad(pal, 'thigh-pad', [230, G - 126], [82, 22], 0)] : []),
    { kind: 'box', nm: 'handle', color: pal.padFar, c: [198, G - 116], s: [34, 9], r: 4.5 },
  ] });
}

/** Bent-over donkey raise: hands remain on a fixed support and the hip pad rests on the pelvis. */
export function donkeyPose(p: number): Pose {
  const a = FOOT_MAX * p;
  const { dx, h } = overBall(a);
  return {
    // With the hips 120 px behind the ankles, this height keeps the long legs nearly straight.
    hip: [180 + dx, G - 152 - (h - A)],
    spine: { lumbar: -37, thoracic: -35 }, neck: -37, head: -32,
    legs: {
      near: { target: [300 + dx, G - h], foot: a, side: [1, 0] },
      far: { target: [294 + dx, G - h], foot: a, side: [1, 0] },
    },
    arms: {
      near: { target: [350, G - 198], side: [-1, 0.3], hand: 0 },
      far: { target: [347, G - 200], side: [-1, 0.3], hand: 0 },
    },
  };
}

export function donkeyProps(machine = false): (pal: Parameters<typeof footPlate>[0]) => Props {
  const step = aerobicStep({ x: 302, h: 31, w: 112 });
  return (pal) => ({ back: [
    ...step.draw(pal),
    tube(pal, 'support-post', [360, G - 5], [360, G - 226], { w: 16, dark: true }),
    tube(pal, 'support-rail', [315, G - 204], [372, G - 204], { w: 11 }),
    ...(machine ? [
      tube(pal, 'lever-upright', [156, G - 5], [156, G - 160], { w: 16 }),
      tube(pal, 'lever-arm', [156, G - 160], [206, G - 151], { w: 14 }),
      pad(pal, 'hip-pad', [196, G - 151], [55, 24], 10),
    ] : []),
  ] });
}

/** Standing calf machine with a fixed calf block and carriage-mounted shoulder pads. */
export function standingMachineProps(): (pal: Parameters<typeof footPlate>[0]) => Props {
  const step = aerobicStep({ x: X + 5, h: 31, w: 114 });
  return (pal) => ({ back: [
    ...step.draw(pal),
    baseRail(pal, X - 92, X + 98),
    tube(pal, 'rear-upright', [X - 60, G - 5], [X - 60, G - 282], { w: 16 }),
    tube(pal, 'top-beam', [X - 60, G - 282], [X + 35, G - 282], { w: 16 }),
    tube(pal, 'guide-rail', [X - 14, G - 274], [X - 14, G - 122], { dark: true, w: 7 }),
    { kind: 'box', nm: 'handle', color: pal.padFar, c: [X + 40, G - 226], s: [10, 68], r: 5 },
  ] });
}

/** Hack sled: the wide back carriage identifies this variant while the calf block stays fixed below. */
export function hackMachineProps(): (pal: Parameters<typeof footPlate>[0]) => Props {
  const step = aerobicStep({ x: X + 5, h: 31, w: 114 });
  return (pal) => ({ back: [
    ...step.draw(pal),
    baseRail(pal, X - 100, X + 102),
    tube(pal, 'sled-rail-a', [X - 84, G - 8], [X - 13, G - 294], { w: 15 }),
    tube(pal, 'sled-rail-b', [X - 46, G - 8], [X + 25, G - 294], { w: 15, dark: true }),
    tube(pal, 'sled-top', [X - 13, G - 294], [X + 52, G - 294], { w: 16 }),
    pad(pal, 'hack-back-pad', [X - 6, G - 190], [28, 166], -14),
    pad(pal, 'hack-shoulder-pad', [X + 8, G - 266], [58, 24], -14),
    { kind: 'box', nm: 'hack-handle', color: pal.padFar, c: [X + 35, G - 218], s: [9, 52], r: 4 },
  ] });
}

export const shoulderPads: MovingPart = {
  nm: 'Shoulder Pads', z: 'back', kind: 'rigid',
  shapes: (pal) => [
    { kind: 'box', nm: 'carriage', color: pal.metal, c: [-24, 3], s: [52, 12], r: 5 },
    { kind: 'box', nm: 'shoulder-pad', color: pal.pad, c: [4, 12], s: [42, 20], r: 8 },
  ],
  at: (J) => ({ p: [J.S[0] - 2, J.S[1] - 6] }),
};

/** Both hands remain on the machine handles rather than hanging by the sides. */
export const machineHandleArms: Pose['arms'] = {
  near: { target: [X + 40, G - 226], side: [-1, 0.2], hand: 0 },
  far: { target: [X + 36, G - 228], side: [-1, 0.2], hand: 0 },
};

/** Smith rack and its bar travel with the shoulders. */
export function smithProps(step = false): (pal: Parameters<typeof footPlate>[0]) => Props {
  const rails = smithRails({ view: 'side', x: X - 2, top: 45 });
  const block = aerobicStep({ x: X + 5, h: 31, w: 114 });
  return (pal) => ({ back: [
    ...rails.draw(pal),
    ...(step ? block.draw(pal) : []),
  ] });
}

/** Side view of an unloaded Smith bar: a small sleeve end, not a full plate that would hide the torso. */
export const smithBar: MovingPart = {
  nm: 'Smith Bar', z: 'underNearArm', kind: 'rigid',
  shapes: (pal) => [
    { kind: 'box', nm: 'bar', color: pal.metalDark, c: [0, 0], s: [76, 10], r: 5 },
    { kind: 'box', nm: 'bar-shaft', color: pal.metal, c: [0, -1], s: [61, 3], r: 1.5 },
    { kind: 'oval', nm: 'bar-sleeve', color: pal.metal, c: [34, 0], s: [13, 13] },
  ],
  at: (J) => ({ p: [X - 2, J.S[1] - 2] }),
};

/** Arms folded around a shoulder-level Smith bar. */
export const smithArms: Pose['arms'] = {
  near: { target: (J) => [J.S[0] + 10, J.S[1] + 28], side: [-1, 0], hand: 180 },
  far: { target: (J) => [J.Sf[0] + 7, J.Sf[1] + 30], side: [-1, 0], hand: 180 },
};

/** Smith seated single-leg calf raise: bar pad bears on the working thigh. */
export function smithSeatedProps(): (pal: Parameters<typeof footPlate>[0]) => Props {
  const rails = smithRails({ view: 'side', x: 236, top: 76 });
  const step = aerobicStep({ x: 296, h: 31, w: 90 });
  return (pal) => ({ back: [
    ...rails.draw(pal), ...step.draw(pal),
    tube(pal, 'seat-post', [160, G - 5], [160, G - 94], { dark: true, w: 15 }),
    seatPad(pal, 175, G - 88, 102),
    pad(pal, 'backrest', [126, G - 166], [18, 150], -7),
  ] });
}

export const smithKneeBar: MovingPart = {
  nm: 'Smith Knee Pad', z: 'front', kind: 'rigid',
  shapes: (pal) => [
    { kind: 'box', nm: 'bar', color: pal.metal, c: [0, 0], s: [70, 9], r: 4 },
    { kind: 'box', nm: 'pad', color: pal.pad, c: [28, 3], s: [34, 20], r: 8 },
  ],
  at: (J) => ({ p: [J.knee_n[0], J.knee_n[1] - 13] }),
};

/** Lower-leg Smith bar from the one-leg source. It tracks just above the working ankle. */
export const smithAnkleBar: MovingPart = {
  nm: 'Smith Lower-Leg Bar', z: 'front', kind: 'rigid',
  shapes: (pal) => [
    { kind: 'box', nm: 'bar', color: pal.metal, c: [0, 0], s: [70, 9], r: 4 },
    { kind: 'box', nm: 'pad', color: pal.pad, c: [23, 3], s: [30, 18], r: 8 },
  ],
  at: (J) => ({ p: [J.ankle_n[0] - 6, J.ankle_n[1] - 20] }),
};

export const gripPoint = (J: Joints, side: 'n' | 'f' = 'n'): Vec2 => gripAt(J, side);
