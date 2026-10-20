// Shared side-view builders for the triceps-extension-3 assignment.
// Each builder fixes the torso and upper arms, then changes only the elbow angle.
// Benches, balls, and stations stay visible so the exercise setup remains recognizable.
import type { LibraryMeta, MovingPart, PropShape, SideExercise } from '@/exercise.ts';
import { add, lerp, sub, type Vec2 } from '@/math.ts';
import { solve, type Joints } from '@/rig.ts';
import { A, G, GRIP_IN_HAND, handOnHip, standLegs } from '@/exercises/common.ts';
import {
  BALL,
  backrestAt,
  barbell,
  dumbbell,
  ezBar,
  flatBench,
  gripAt,
  inclineBench,
  kettlebell,
  stabilityBall,
  declineBench,
  smithRails,
  tube,
  seatPad,
  weightStack,
  workTL,
} from '@/exercises/equipment/index.ts';

export type Detail = {
  id: string;
  name: string;
  en: string;
  equipment: LibraryMeta['equipment'];
  sources: string[];
};

type OverheadKind = 'dumbbell' | 'ez' | 'kettlebell' | 'towel' | 'sled';
type LyingKind = 'dumbbell' | 'ez' | 'chain';

const meta = (d: Detail): LibraryMeta => ({
  en: d.en,
  family: 'triceps-extension',
  equipment: d.equipment,
  sources: d.sources,
});

const OVERHEAD_TL = workTL(0.35);
const STANDARD_TL = workTL(0.3);

/** A held towel is a visible folded strip rather than a rigid weight. */
const towelPart: MovingPart<Joints> = {
  nm: 'Towel', kind: 'rigid', z: 'front',
  shapes: (pal) => [
    { kind: 'box', nm: 'towel-fold', color: pal.pad, c: [0, 0], s: [38, 8], r: 4 },
    { kind: 'box', nm: 'towel-stripe', color: pal.accent, c: [0, -1], s: [28, 2], r: 1 },
  ],
  at: (J) => ({ p: gripAt(J, 'n'), a: J.hand_n.a + 90 }),
};

/** Two short chain handles, seen edge-on in the side view. */
const chainHandlePart: MovingPart<Joints> = {
  nm: 'Chain Handles', kind: 'rigid', z: 'front',
  shapes: (pal) => [
    { kind: 'box', nm: 'handle', color: pal.metalDark, c: [0, 0], s: [22, 7], r: 3 },
    { kind: 'ring', nm: 'chain-link-a', color: pal.metal, c: [0, 10], s: [8, 12], w: 2 },
    { kind: 'ring', nm: 'chain-link-b', color: pal.metal, c: [0, 21], s: [8, 12], w: 2 },
    { kind: 'ring', nm: 'chain-link-c', color: pal.metal, c: [0, 32], s: [8, 12], w: 2 },
  ],
  at: (J) => ({ p: gripAt(J, 'n'), a: J.hand_n.a + 90 }),
};

const overheadHeld = (kind: OverheadKind): MovingPart<Joints> => {
  switch (kind) {
    case 'dumbbell': return dumbbell('n', 'end');
    case 'ez': return ezBar({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) });
    case 'kettlebell': return kettlebell((J) => ({ p: gripAt(J, 'n') }), 'face');
    case 'towel': return towelPart;
    case 'sled': return {
      nm: 'Dual Rope Handles', kind: 'rigid', z: 'front',
      shapes: (pal) => [
        { kind: 'box', nm: 'dual-handle', color: pal.padFar, c: [0, 0], s: [28, 8], r: 4 },
        { kind: 'oval', nm: 'handle-ring', color: pal.metal, c: [0, 7], s: [8, 8] },
      ],
      at: (J) => ({ p: gripAt(J, 'n'), a: J.hand_n.a + 90 }),
    };
  }
};

/** Upright standing setup with a neutral spine and planted parallel feet. */
const standingBase = (x = 264) => ({
  // 183.6 px is just below the 184 px straight-leg reach, so the knees stay near 175°.
  hip: [x, G - A - 183.6] as Vec2,
  spine: { lumbar: -90, thoracic: -90 },
  neck: -90,
  head: -90,
  legs: standLegs(x, -7),
});

/**
 * Standing or seated overhead extension. The upper arm stays vertical beside the ear.
 * The forearm starts down and behind the head at about 45° of elbow flexion, then reaches lockout.
 */
export function makeOverhead(d: Detail, opts: {
  kind: OverheadKind;
  seat?: 'bench' | 'ball';
  single?: boolean;
  supportUpperArm?: boolean;
}): SideExercise {
  const x = opts.seat ? 252 : 264;
  const bench = opts.seat === 'bench' ? flatBench({ view: 'side', x, top: 90, length: 156 }) : undefined;
  const hip: Vec2 = opts.seat === 'ball' ? [x, G - 126] : opts.seat ? [x - 14, G - 113] : standingBase(x).hip;
  const legs = opts.seat
    ? {
      near: { target: [x + 66, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
      far: { target: [x + 59, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
    }
    : standLegs(x, -7);
  const dynamic: MovingPart<Joints>[] = [];
  if (opts.seat === 'ball') dynamic.push(stabilityBall<Joints>(() => ({ p: [x, G - BALL.r] })));
  dynamic.push(overheadHeld(opts.kind));
  if (opts.kind === 'sled') {
    dynamic.push({
      nm: 'Sled Rope', kind: 'line', z: 'back', width: 4.5,
      color: (pal) => pal.cable,
      at: (J) => [[x - 122, G - 64], gripAt(J, 'n')],
    });
  }
  return {
    id: d.id,
    name: d.name,
    tl: OVERHEAD_TL,
    meta: meta(d),
    muscles: [
      { m: 'triceps', side: opts.single ? 'near' : 'both' },
      { m: 'delts', side: opts.single ? 'near' : 'both', scale: 0.35 },
      ...(opts.kind === 'kettlebell' ? [{ m: 'abs' as const, scale: 0.35 }] : []),
    ],
    props: (pal) => ({
      back: [
        ...(bench?.draw(pal) ?? []),
        ...(opts.kind === 'sled' ? [
          { kind: 'box' as const, nm: 'sled-rail', color: pal.metalDark, c: [x - 132, G - 12] as Vec2, s: [64, 12] as Vec2, r: 4 },
          { kind: 'box' as const, nm: 'sled-upright', color: pal.metal, c: [x - 144, G - 39] as Vec2, s: [12, 46] as Vec2, r: 4 },
          { kind: 'oval' as const, nm: 'sled-plate', color: pal.plate, c: [x - 119, G - 30] as Vec2, s: [38, 38] as Vec2 },
          { kind: 'box' as const, nm: 'sled-post', color: pal.metalDark, c: [x - 119, G - 55] as Vec2, s: [8, 44] as Vec2, r: 3 },
        ] as PropShape[] : []),
      ],
    }),
    propsBox: opts.kind === 'sled' ? [x - 170, x + 88] : (opts.seat === 'ball' ? [x - BALL.r, x + BALL.r] : bench?.box),
    dynamic,
    pose: (t: number) => {
      const p = OVERHEAD_TL.at(t).p;
      // 135° means the forearm points down and back; 270° is the same as -90°, a straight arm.
      const fore = lerp(135, 270, p);
      const far = opts.single
        ? (opts.supportUpperArm
          ? { target: (J: Joints) => add(J.elbow_n, [0, 18]), side: [1, 0] as Vec2, hand: 180 }
          : handOnHip(-5))
        : { a1: -90, a2: fore, hand: fore };
      return {
        hip,
        spine: { lumbar: -90, thoracic: -90 },
        neck: -90,
        head: -90,
        legs,
        arms: { near: { a1: -90, a2: fore, hand: fore }, far },
      };
    },
  };
}

/** Bent-over kickback. The torso and upper arm are fixed; only the forearm swings from vertical to horizontal. */
export function makeKickback(d: Detail, opts: { single?: boolean; seated?: boolean }): SideExercise {
  const tl = STANDARD_TL;
  const bench = opts.seated ? flatBench({ view: 'side', x: 238, top: 88, length: 170 }) : undefined;
  const hip: Vec2 = opts.seated ? [222, G - 110] : [238, G - A - 180];
  const legs = opts.seated
    ? {
      near: { target: [304, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
      far: { target: [297, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
    }
    : {
      near: { target: [264, G - A] as Vec2, foot: 0, side: [1, 0] as Vec2 },
      far: { target: [253, G - A] as Vec2, foot: 0, side: [1, 0] as Vec2 },
    };
  return {
    id: d.id,
    name: d.name,
    tl,
    meta: meta(d),
    muscles: [
      { m: 'triceps', side: opts.single ? 'near' : 'both' },
      { m: 'delts', side: opts.single ? 'near' : 'both', scale: 0.4 },
      { m: 'upperBack', scale: 0.35 },
    ],
    props: (pal) => ({ back: bench?.draw(pal) }),
    propsBox: bench?.box,
    dynamic: opts.single ? [dumbbell('n', 'profile')] : [dumbbell('n', 'profile'), dumbbell('f', 'profile')],
    pose: (t: number) => {
      const fore = lerp(90, 180, tl.at(t).p);
      return {
        hip,
        spine: { lumbar: -26, thoracic: -28 },
        neck: -19,
        head: -14,
        legs,
        arms: {
          near: { a1: 180, a2: fore, hand: fore + 90 },
          far: opts.single ? handOnHip(-7) : { a1: 180, a2: fore, hand: fore + 90 },
        },
      };
    },
  };
}

/** Flat-bench lying extension. The bar or dumbbell lowers by elbow flexion while the upper arm remains vertical. */
export function makeLyingExtension(d: Detail, opts: {
  kind: LyingKind;
  lower: 'forehead' | 'behind-head' | 'chin';
  single?: boolean;
  supported?: boolean;
}): SideExercise {
  const tl = STANDARD_TL;
  const bench = flatBench({ view: 'side', x: 252, top: 90, length: 250 });
  const neck: Vec2 = [145, G - 110];
  const hip: Vec2 = [269, G - 110];
  const ankle: Vec2 = [372, G - A];
  // Each named destination has a different end point: chin in front,
  // forehead beside it, or behind the head. The upper arm remains vertical.
  const flexedFore = opts.lower === 'behind-head' ? 180 : opts.lower === 'chin' ? 120 : 135;
  const dynamic: MovingPart<Joints>[] = opts.kind === 'dumbbell'
    ? [dumbbell('n', 'end')]
    : opts.kind === 'ez'
      ? [ezBar({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })]
      : [chainHandlePart];
  return {
    id: d.id,
    name: d.name,
    tl,
    meta: meta(d),
    muscles: [
      { m: 'triceps', side: opts.single ? 'near' : 'both' },
      ...(opts.kind === 'chain' ? [{ m: 'forearms' as const, side: 'both' as const, scale: 0.35 }] : []),
    ],
    props: (pal) => ({ back: bench.draw(pal) }),
    propsBox: bench.box,
    dynamic,
    pose: (t: number) => {
      const fore = lerp(flexedFore, 270, tl.at(t).p);
      return {
        hip,
        spine: { lumbar: 180, thoracic: 180 },
        neck: 180,
        head: 180,
        legs: {
          near: { target: ankle, foot: 0, side: [0, -1] },
          far: { target: add(ankle, [-6, 0]), foot: 0, side: [0, -1] },
        },
        arms: {
          near: { a1: -90, a2: fore, hand: fore },
          far: opts.single
            ? (opts.supported
              ? { target: (J: Joints) => add(J.elbow_n, [4, 22]), side: [-1, 0] as Vec2, hand: 180 }
              : { a1: 0, a2: 0, hand: 0 })
            : { a1: -90, a2: fore, hand: fore },
        },
      };
    },
  };
}

/** Decline-bench skullcrusher. Ankles hook under the bench roller while the arms stay vertical to the floor. */
export function makeDeclineEz(d: Detail, closeGrip: boolean): SideExercise {
  const tl = STANDARD_TL;
  const bench = declineBench({ x: 100, angle: 18, low: 74, length: 220 });
  const hip: Vec2 = [252, G - 128];
  return {
    id: d.id,
    name: d.name,
    tl,
    meta: meta(d),
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: bench.draw(pal) }),
    propsBox: bench.box,
    dynamic: [ezBar({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t: number) => {
      // The bar reaches the forehead at about 45° of elbow flexion.
      const fore = lerp(135, 270, tl.at(t).p);
      return {
        hip,
        spine: { lumbar: 162, thoracic: 162 },
        neck: 162,
        head: 162,
        legs: {
          near: { target: bench.roller, foot: -18, side: [0, -1] },
          far: { target: add(bench.roller, [-5, 2]), foot: -18, side: [0, -1] },
        },
        arms: {
          near: { a1: -90, a2: fore, hand: fore },
          far: { a1: -90, a2: fore, hand: fore },
        },
      };
    },
    // Both variants have the same setup. The close-grip record differs only by its named grip.
    poster: closeGrip ? 0.27 : 0.27,
  };
}

/** Incline seated overhead extension: the torso follows a 45° back pad while upper arms remain vertical. */
export function makeInclineEz(d: Detail): SideExercise {
  const tl = STANDARD_TL;
  const bench = inclineBench({ x: 238, angle: 45, top: 90, back: 176, seat: 76 });
  const hip: Vec2 = [252, G - 117];
  return {
    id: d.id,
    name: d.name,
    tl,
    meta: meta(d),
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: bench.draw(pal) }),
    propsBox: bench.box,
    dynamic: [ezBar({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t: number) => {
      const fore = lerp(135, 270, tl.at(t).p);
      return {
        hip,
        spine: { lumbar: -135, thoracic: -135 },
        neck: -135,
        head: -135,
        legs: {
          near: { target: [312, G - A], foot: 0, side: [0, -1] },
          far: { target: [305, G - A], foot: 0, side: [0, -1] },
        },
        arms: { near: { a1: -90, a2: fore, hand: fore }, far: { a1: -90, a2: fore, hand: fore } },
      };
    },
  };
}

/** JM press uses the supplied close-grip bench-press path: bar to lower chest and elbows tucked. */
export function makeJmPress(d: Detail): SideExercise {
  const tl = STANDARD_TL;
  const bench = flatBench({ view: 'side', x: 252, top: 90, length: 250 });
  const hip: Vec2 = [269, G - 110];
  const ankle: Vec2 = [372, G - A];
  return {
    id: d.id,
    name: d.name,
    tl,
    meta: meta(d),
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'pecs', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: bench.draw(pal) }),
    propsBox: bench.box,
    dynamic: [ezBar({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t: number) => {
      const p = tl.at(t).p;
      return {
        hip,
        spine: { lumbar: 180, thoracic: 180 },
        neck: 180,
        head: 180,
        legs: {
          near: { target: ankle, foot: 0, side: [0, -1] },
          far: { target: add(ankle, [-6, 0]), foot: 0, side: [0, -1] },
        },
        arms: {
          near: { a1: lerp(60, -90, p), a2: lerp(-70, -90, p), hand: lerp(-70, -90, p) },
          far: { a1: lerp(60, -90, p), a2: lerp(-70, -90, p), hand: lerp(-70, -90, p) },
        },
      };
    },
  };
}

/** Selectorized seated extension with upper arms on pads and handles driven by elbow extension. */
export function makeMachineExtension(d: Detail): SideExercise {
  const tl = workTL(0.35);
  const hip: Vec2 = [224, G - 111];
  const legs = {
    near: { target: [306, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
    far: { target: [299, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
  };
  const probe = solve({
    hip,
    spine: { lumbar: -90, thoracic: -90 },
    neck: -90,
    head: -90,
    legs,
    arms: { near: { a1: 0, a2: -85 }, far: { a1: 0, a2: -85 } },
  });
  const rest = backrestAt(probe, 0.58);
  const stack = weightStack({ x: 104, top: 84, lift: (t) => 28 * tl.at(t).p });
  const handle: MovingPart<Joints> = {
    nm: 'Triceps Handles', kind: 'rigid', z: 'underNearArm',
    shapes: (pal) => [
      { kind: 'box', nm: 'handle', color: pal.padFar, c: [0, 0], s: [22, 8], r: 4 },
      { kind: 'box', nm: 'lever-link', color: pal.metal, c: [-19, 0], s: [24, 7], r: 3 },
    ],
    at: (J) => ({ p: gripAt(J, 'n'), a: J.hand_n.a }),
  };
  return {
    id: d.id,
    name: d.name,
    tl,
    meta: meta(d),
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({
      back: [
        ...stack.fixed(pal),
        tube(pal, 'base-rail', [76, G - 5], [372, G - 5], { dark: true, w: 11 }),
        tube(pal, 'stack-link', [132, G - 215], [282, G - 215], { dark: true, w: 9 }),
        tube(pal, 'seat-post', [234, G - 5], [234, G - 95], { dark: true, w: 14 }),
        tube(pal, 'elbow-pad-post', [322, G - 5], [322, G - 196], { w: 14 }),
        tube(pal, 'elbow-pad-arm', [282, G - 196], [334, G - 196], { w: 10 }),
        { kind: 'box', nm: 'backrest', color: pal.pad, c: rest.c, s: rest.size, r: 9, rot: rest.rot },
        seatPad(pal, 244, G - 88, 98),
        { kind: 'box', nm: 'upper-arm-pad', color: pal.pad, c: [326, G - 196], s: [18, 66], r: 8, rot: 90 },
      ],
    }),
    propsBox: [stack.box[0], 382],
    dynamic: [stack.dynamic, handle],
    pose: (t: number) => {
      const fore = lerp(-85, 0, tl.at(t).p);
      return {
        hip,
        spine: { lumbar: -90, thoracic: -90 },
        neck: -90,
        head: -90,
        legs,
        arms: { near: { a1: 0, a2: fore, hand: fore }, far: { a1: 0, a2: fore, hand: fore } },
      };
    },
  };
}

/** Supine ball extension: the upper back rests on the ball, hips stay lifted, and both feet remain planted. */
export function makeBallLyingExtension(d: Detail): SideExercise {
  const tl = STANDARD_TL;
  const hip: Vec2 = [326, G - 137];
  const neck: Vec2 = [203, G - 137];
  const ankle: Vec2 = [384, G - A];
  return {
    id: d.id,
    name: d.name,
    tl,
    meta: meta(d),
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'abs', scale: 0.3 }],
    dynamic: [
      stabilityBall<Joints>(() => ({ p: [232, G - BALL.r] })),
      dumbbell('n', 'end'),
    ],
    propsBox: [164, 410],
    pose: (t: number) => {
      const fore = lerp(135, 270, tl.at(t).p);
      return {
        hip,
        spine: { target: neck, side: [0, 1] },
        neck: 180,
        head: 180,
        legs: {
          near: { target: ankle, foot: 0, side: [0, -1] },
          far: { target: add(ankle, [-6, 0]), foot: 0, side: [0, -1] },
        },
        arms: {
          near: { a1: -90, a2: fore, hand: fore },
          far: { a1: -90, a2: fore, hand: fore },
        },
      };
    },
  };
}

/** Smith-machine incline extension with a bar that slides vertically down toward the forehead. */
export function makeSmithIncline(d: Detail): SideExercise {
  const tl = STANDARD_TL;
  const bench = inclineBench({ x: 242, angle: 58, top: 90, back: 176, seat: 76 });
  const hip: Vec2 = [255, G - 116];
  // The plate center remains on this rail as it travels vertically beside the forehead.
  const railX = 167;
  const barY = (t: number) => lerp(222, 144, tl.at(t).p);
  const rail = smithRails({ view: 'side', x: railX });
  return {
    id: d.id,
    name: d.name,
    tl,
    meta: meta(d),
    muscles: [{ m: 'triceps', side: 'both' }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: [...rail.draw(pal), ...bench.draw(pal)] }),
    propsBox: [Math.min(rail.box[0], bench.box[0]), Math.max(rail.box[1], bench.box[1])],
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t: number) => {
      // The wrist is 9 px behind the closed-hand grip, so this fixes the plate center to the rail.
      const wristY = barY(t) + 9;
      return {
        hip,
        spine: { lumbar: -148, thoracic: -148 },
        neck: -148,
        head: -148,
        legs: {
          near: { target: [316, G - A], foot: 0, side: [0, -1] },
          far: { target: [309, G - A], foot: 0, side: [0, -1] },
        },
        arms: {
          near: { target: [railX, wristY], side: [1, 0], hand: -90 },
          far: { target: (J: Joints) => add([railX, wristY], sub(J.Sf, J.S)), side: [1, 0], hand: -90 },
        },
      };
    },
  };
}

/** Distance from wrist to the center of a side-view held bar or handle; kept for explicit hand-placement comments. */
export const HAND_TO_GRIP = GRIP_IN_HAND;
