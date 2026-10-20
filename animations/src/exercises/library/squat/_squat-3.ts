// Private builders for the squat-3 work list. They keep the squat range, planted feet, and machine geometry consistent.
// The factories keep every exercise file small while each file declares its distinct instructions and source metadata.
import type { PropShape, RigidPart, SideExercise } from '@/exercise.ts';
import { add, ang, dir, lerp, mul, sub, timeline, type Vec2 } from '@/math.ts';
import { solve, type Joints, type LimbSpec, type Pose } from '@/rig.ts';
import { A, G, GRIP_IN_HAND, hipForShoulder, standLegs } from '@/exercises/common.ts';
import {
  backrestAt, barbell, baseRail, footPlate, heldPlate, landmine, pad, seatPad, smithRails, tube, weightStack, workTL,
} from '@/exercises/equipment/index.ts';

export type SquatInfo = { id: string; name: string; en: string; sources: string[] };

const squatTL = timeline([
  { d: 1.25, from: 0, to: 1, e: [0.35, 1] },
  { d: 0.35, from: 1, to: 1, e: [1, 0.92] },
  { d: 1.55, from: 1, to: 0, e: [0.85, 0.38] },
  { d: 0.45, from: 0, to: 0, e: [0.35, 0.3] },
]);

/** Lower body of a planted, parallel-depth squat. The hips travel back before they descend. */
function squatBody(p: number, opts: { x?: number; back?: number; depth?: number; lean?: number; farDx?: number } = {}): Omit<Pose, 'arms'> {
  const x = opts.x ?? 280;
  const back = opts.back ?? 76;
  const depth = opts.depth ?? 104;
  const lean = opts.lean ?? -51;
  const travel = Math.sin((p * Math.PI) / 2);
  const drop = 1 - Math.cos((p * Math.PI) / 2);
  return {
    hip: [lerp(x, x - back, travel), lerp(G - A - 184, G - A - depth, drop)],
    spine: { lumbar: lerp(-88, lean, p), thoracic: lerp(-91, lean - 4, p) },
    neck: lerp(-86, lean - 10, p),
    head: lerp(-89, lean - 19, p),
    legs: standLegs(x, opts.farDx ?? -5),
  };
}

/** Both hands cup a chest load. The far hand sits behind the near hand in side view. */
function chestArm(dx: number): LimbSpec {
  return {
    target: (J) => add(add(J.B(0.82), mul(J.A(0.82), 30)), mul(J.T(0.82), dx)),
    side: (J) => mul(J.T(0.62), -1),
    hand: (J) => ang(J.A(0.82)),
  };
}

function chestLoad(J: Joints): Vec2 {
  return add(J.B(0.82), mul(J.A(0.82), 47));
}

/** A conventional chest-loaded squat. */
export function weightedSquat(info: SquatInfo): SideExercise {
  return {
    ...info,
    tl: squatTL,
    meta: { en: info.en, family: 'squat', equipment: ['plate'], sources: info.sources },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes' }, { m: 'abs', scale: 0.35 }],
    dynamic: [heldPlate<Joints>((J) => ({ p: chestLoad(J) }), 'face', 'medium')],
    pose(t) {
      const body = squatBody(squatTL.at(t).p, { back: 69, depth: 98, lean: -57 });
      return { ...body, arms: { near: chestArm(0), far: chestArm(-4) } };
    },
  };
}

/** A belt squat between elevated platforms, with the load hanging from the pelvis. */
export function beltSquat(info: SquatInfo): SideExercise {
  const x = 270;
  return {
    ...info,
    tl: squatTL,
    meta: { en: info.en, family: 'squat', equipment: ['other', 'plate'], sources: info.sources },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.45 }],
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'near-bench-top', color: pal.pad, c: [x + 8, G - 15], s: [142, 16], r: 7 },
        { kind: 'box', nm: 'near-bench-leg-a', color: pal.metalDark, c: [x - 41, G - 7], s: [10, 30], r: 3 },
        { kind: 'box', nm: 'near-bench-leg-b', color: pal.metalDark, c: [x + 57, G - 7], s: [10, 30], r: 3 },
        { kind: 'box', nm: 'far-bench-top', color: pal.padFar, c: [x - 82, G - 15], s: [72, 16], r: 7 },
      ],
    }),
    dynamic: [
      heldPlate<Joints>((J) => ({ p: add(J.H, [4, 70]) }), 'face', 'medium', 'front', 'Belt Weight'),
      {
        nm: 'Belt Chain', kind: 'line', z: 'front', width: 3,
        color: (pal) => pal.metal,
        at: (J) => [add(J.H, [4, 11]), add(J.H, [4, 43])],
      },
    ],
    propsBox: [x - 126, x + 86],
    pose(t) {
      const body = squatBody(squatTL.at(t).p, { x, back: 67, depth: 101, lean: -77, farDx: -4 });
      return {
        ...body,
        arms: {
          near: { a1: 88, a2: 90, hand: 88 },
          far: { a1: 92, a2: 90, hand: 92 },
        },
      };
    },
  };
}

/** Sissy squat with one rack hand and a plate at the chest. The torso remains nearly upright while knees travel forward. */
export function supportedSissySquat(info: SquatInfo): SideExercise {
  const x = 267, rackX = 373, hand: Vec2 = [348, G - 211];
  return {
    ...info,
    tl: squatTL,
    meta: { en: info.en, family: 'squat', equipment: ['plate', 'smith'], sources: info.sources },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.35 }, { m: 'glutes', scale: 0.3 }],
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'rack-upright', color: pal.prop, c: [rackX, (G - 60) / 2], s: [15, G - 60], r: 3 },
        { kind: 'box', nm: 'rack-base', color: pal.metalDark, c: [rackX, G - 4], s: [74, 8], r: 3 },
        { kind: 'box', nm: 'rack-grip', color: pal.metal, c: [(rackX + hand[0]) / 2, hand[1]], s: [rackX - hand[0] + 12, 9], r: 4 },
      ],
    }),
    dynamic: [heldPlate<Joints>((J) => ({ p: chestLoad(J) }), 'face', 'small')],
    propsBox: [x - 60, rackX + 38],
    pose(t) {
      const p = squatTL.at(t).p;
      return {
        hip: [lerp(x, x + 77, p), lerp(G - A - 184, G - A - 104, p)],
        spine: { lumbar: lerp(-91, -99, p), thoracic: lerp(-93, -101, p) },
        neck: lerp(-91, -98, p), head: lerp(-90, -95, p),
        legs: {
          near: { target: [x, G - A], foot: lerp(-8, -14, p), side: [1, 0] },
          far: { target: [x - 4, G - A], foot: lerp(-8, -14, p), side: [1, 0] },
        },
        arms: {
          near: { target: hand, side: [0, -1], hand: 0 },
          far: chestArm(-4),
        },
      };
    },
  };
}

/** A landmine jammer: a squat starts with the handles at the shoulders and finishes with a long diagonal press. */
export function landmineSquatToPress(info: SquatInfo): SideExercise {
  const pivot: Vec2 = [143, G - 8];
  const mine = landmine<Joints>(pivot, (J) => add(J.wrist_n, mul(dir(J.hand_n.a), GRIP_IN_HAND)), 'side', 46, 'medium');
  return {
    ...info,
    tl: squatTL,
    meta: { en: info.en, family: 'squat', equipment: ['landmine', 'barbell'], sources: info.sources },
    muscles: [
      { m: 'quads', side: 'both' }, { m: 'glutes' }, { m: 'delts', side: 'both', scale: 0.75 },
      { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'calves', side: 'both', scale: 0.3 },
    ],
    props: (pal) => ({ back: mine.base(pal) }),
    dynamic: mine.parts,
    propsBox: [pivot[0] - 20, 420],
    pose(t) {
      const p = squatTL.at(t).p;
      const body = squatBody(1 - p, { x: 274, back: 67, depth: 101, lean: -62, farDx: -4 });
      const handAngle = -44;
      const arm = (far: boolean): LimbSpec => ({
        target: (J) => {
          const grip = add(J.S, [lerp(34, 74, p), lerp(30, -91, p)]);
          const shifted = far ? add(grip, sub(J.Sf, J.S)) : grip;
          return sub(shifted, mul(dir(handAngle), GRIP_IN_HAND));
        },
        side: [-1, 0], hand: handAngle,
      });
      return { ...body, arms: { near: arm(false), far: arm(true) } };
    },
  };
}

/** Hack-squat sled: the torso stays on the moving angled pad while the feet remain on the platform. */
export function hackSquat(info: SquatInfo, narrow = false): SideExercise {
  const x = 282;
  return {
    ...info,
    tl: squatTL,
    meta: { en: info.en, family: 'squat', equipment: ['machine'], sources: info.sources },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.4 }],
    props: (pal) => ({
      back: [
        baseRail(pal, 130, 365),
        tube(pal, 'left-sled-rail', [157, G - 28], [221, 156], { dark: true, w: 11 }),
        tube(pal, 'right-sled-rail', [193, G - 28], [257, 156], { dark: true, w: 11 }),
        footPlate(pal, 'angled-foot-platform', [x + 17, G - 14], [140, 14], -5),
      ],
    }),
    dynamic: [{
      nm: 'Hack Sled', kind: 'rigid', z: 'back',
      shapes: (pal) => [
        { kind: 'box', nm: 'back-pad', color: pal.pad, c: [20, 0], s: [20, 166], r: 9 },
        { kind: 'box', nm: 'shoulder-pad', color: pal.pad, c: [20, -60], s: [42, 18], r: 8 },
        { kind: 'box', nm: 'sled-post', color: pal.metal, c: [35, 8], s: [11, 184], r: 4 },
        { kind: 'box', nm: 'handle', color: pal.padFar, c: [-14, -36], s: [30, 9], r: 4 },
      ],
      at: (J) => ({ p: J.B(0.51), a: J.tAbs.a - 90 }),
    }],
    propsBox: [122, 374],
    pose(t) {
      const body = squatBody(squatTL.at(t).p, { x, back: 59, depth: 103, lean: -74, farDx: narrow ? -1 : -10 });
      const handle = (dx: number): LimbSpec => ({
        target: (J) => add(add(J.B(0.7), mul(J.A(0.7), -12)), mul(J.T(0.7), dx)),
        side: [-1, 0], hand: 180,
      });
      return { ...body, arms: { near: handle(-12), far: handle(-16) } };
    },
  };
}

type SeatedPressOptions = SquatInfo & {
  delta: number; farDx?: number; single?: boolean; alternating?: boolean; smith?: boolean;
};

/** Reclined sled or horizontal leg press. The back stays on the pad while feet drive an independently moving plate. */
export function seatedLegPress(opts: SeatedPressOptions): SideExercise {
  const regularTL = workTL(0.35);
  const tl = opts.alternating ? { total: 4 } : regularTL;
  const hip: Vec2 = [156, G - 128];
  const d0 = 124, d1 = 183;
  const foot = opts.delta - 90 + 4;
  const pNear = (t: number): number => opts.alternating ? (1 - Math.cos(Math.PI * 2 * t)) / 2 : regularTL.at(t).p;
  const pFar = (t: number): number => opts.alternating ? 1 - pNear(t) : pNear(t);
  const ankle = (p: number): Vec2 => add(hip, mul(dir(opts.delta), lerp(d0, d1, p)));
  const probe = solve({
    hip, spine: { lumbar: -116, thoracic: -118 }, neck: -108, head: -101,
    legs: { near: { target: ankle(0), foot, side: [0, -1] }, far: { target: add(ankle(0), [-4, -1]), foot, side: [0, -1] } },
    arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } },
  });
  const rest = backrestAt(probe, 0.5, 9, [18, 170], 18);
  const railStart = add(hip, mul(dir(opts.delta), 56));
  const railEnd = add(hip, mul(dir(opts.delta), d1 + 60));
  const stack = weightStack({
    x: rest.c[0] - 83,
    top: Math.min(90, rest.c[1] - 105),
    lift: (t) => 31 * Math.max(pNear(t), pFar(t)),
  });
  const plate = (nm: string, at: (t: number) => Vec2): RigidPart<Joints> => ({
    nm, kind: 'rigid' as const, z: 'back' as const,
    shapes: (pal): PropShape[] => [
      { kind: 'box', nm: 'carriage', color: pal.metal, c: [-18, 23], s: [44, 13], r: 4 },
      footPlate(pal, 'footplate', [0, -7], [12, 108], 0),
    ],
    at: (_J: Joints, t: number) => ({ p: add(at(t), mul(dir(opts.delta), 20)), a: opts.delta }),
  });
  const activeMuscles = opts.single
    ? [{ m: 'quads' as const, side: 'near' as const }, { m: 'glutes' as const, scale: 0.75 }]
    : [{ m: 'quads' as const, side: 'both' as const }, { m: 'glutes' as const }, { m: 'hamstrings' as const, side: 'both' as const, scale: 0.35 }];
  return {
    id: opts.id,
    name: opts.name,
    tl,
    meta: { en: opts.en, family: 'squat', equipment: [opts.smith ? 'smith' : 'machine'], sources: opts.sources },
    muscles: opts.alternating
      ? activeMuscles.map((m) => ({ ...m, e: () => 0.9 }))
      : activeMuscles,
    props: (pal) => ({
      back: [
        ...stack.fixed(pal),
        baseRail(pal, stack.box[0], Math.max(railEnd[0] + 42, hip[0] + 80)),
        tube(pal, 'press-rail', railStart, railEnd, { w: 11 }),
        tube(pal, 'backrest-arm', rest.c, [hip[0] + 5, hip[1] + 31], { dark: true, w: 10 }),
        tube(pal, 'seat-post', [hip[0] + 12, G - 5], [hip[0] + 12, hip[1] + 27], { dark: true, w: 16 }),
        pad(pal, 'backrest', rest.c, rest.size, rest.rot),
        seatPad(pal, hip[0] + 15, hip[1] + 25, 96),
        { kind: 'box', nm: 'side-handle', color: pal.padFar, c: [hip[0] + 30, hip[1] + 8], s: [34, 9], r: 4 },
      ],
    }),
    propsBox: [stack.box[0], Math.max(railEnd[0] + 75, hip[0] + 105)],
    dynamic: opts.alternating
      ? [stack.dynamic, plate('Near Footplate', (t) => ankle(pNear(t))), plate('Far Footplate', (t) => add(ankle(pFar(t)), [-7, -3]))]
      : [stack.dynamic, plate('Footplate', (t) => ankle(pNear(t)))],
    pose(t) {
      const near = ankle(pNear(t));
      const far = opts.single ? ankle(0) : opts.alternating ? add(ankle(pFar(t)), [-7, -3]) : add(near, [opts.farDx === -1 ? -2 : opts.farDx ?? -4, opts.farDx === -1 ? 0 : -1]);
      return {
        hip, spine: { lumbar: -116, thoracic: -118 }, neck: -108, head: -101,
        legs: {
          near: { target: near, foot, side: [0, -1] },
          far: { target: far, foot, side: [0, -1] },
        },
        arms: {
          near: { target: [hip[0] + 28, hip[1] + 8], side: [-1, 0.2], hand: 0 },
          far: { target: [hip[0] + 24, hip[1] + 5], side: [-1, 0.2], hand: 0 },
        },
      };
    },
  };
}

type SupinePressOptions = SquatInfo & { smith?: boolean };

/** A face-up sled press. Hip and back stay supported; only the knees and hips close as the sled returns. */
export function supineLegPress(opts: SupinePressOptions): SideExercise {
  const tl = workTL(0.35);
  const hip: Vec2 = [236, G - 63];
  const spineEnd: Vec2 = [118, G - 62];
  const x = 263;
  const ankle = (p: number): Vec2 => [x, lerp(G - 180, G - 244, p)];
  const plate = (nm: string): RigidPart<Joints> => ({
    nm, kind: 'rigid' as const, z: 'back' as const,
    shapes: (pal): PropShape[] => [
      { kind: 'box', nm: 'carriage', color: pal.metal, c: [0, -20], s: [34, 14], r: 4 },
      footPlate(pal, 'wide-footplate', [0, -35], [124, 12], 0),
    ],
    at: (J: Joints) => ({ p: J.ankle_n, a: 0 }),
  });
  const smith = opts.smith ? smithRails({ view: 'side', x, top: 48 }) : undefined;
  return {
    id: opts.id,
    name: opts.name,
    tl,
    mat: !opts.smith,
    meta: { en: opts.en, family: 'squat', equipment: [opts.smith ? 'smith' : 'machine'], sources: opts.sources },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
    props: (pal) => ({
      back: opts.smith
        ? smith!.draw(pal)
        : [
          baseRail(pal, 82, 345),
          tube(pal, 'bench-post', [166, G - 5], [166, G - 59], { dark: true, w: 15 }),
          tube(pal, 'sled-rail-a', [x - 31, G - 72], [x - 31, 126], { w: 10 }),
          tube(pal, 'sled-rail-b', [x + 31, G - 72], [x + 31, 126], { w: 10 }),
          pad(pal, 'supine-back-pad', [177, G - 57], [204, 25]),
          { kind: 'box', nm: 'head-pad', color: pal.padFar, c: [104, G - 59], s: [45, 30], r: 9 },
        ],
    }),
    propsBox: opts.smith ? smith!.box : [70, 355],
    dynamic: opts.smith
      ? [barbell<Joints>({ view: 'side', plate: 'medium', at: (J) => ({ p: add(J.ankle_n, [0, -34]) }) })]
      : [plate('Sled Footplate')],
    pose(t) {
      const a = ankle(tl.at(t).p);
      return {
        hip, spine: { target: spineEnd, side: [0, 1] }, neck: 180, head: 180,
        legs: {
          near: { target: a, foot: -90, side: [1, 0] },
          far: { target: add(a, [-5, 2]), foot: -90, side: [1, 0] },
        },
        arms: {
          near: { target: [168, G - 63], side: [0, 1], hand: 180 },
          far: { target: [157, G - 65], side: [0, 1], hand: 180 },
        },
      };
    },
  };
}

type SmithOptions = SquatInfo & { front?: boolean; chair?: boolean; deep?: boolean; low?: boolean; feet?: number };

/** A Smith-machine squat derives the hip from the rail-bound bar, so the bar path remains vertical. */
export function smithSquat(opts: SmithOptions): SideExercise {
  const railX = 260;
  const xFoot = opts.feet ?? (opts.chair ? 330 : opts.low ? 270 : 281);
  const front = opts.front ?? false;
  const topY = opts.chair ? (opts.feet ? 155 : 160) : front ? 155 : 150;
  const bottomY = opts.deep ? 250 : opts.chair ? (opts.feet ? 275 : 305) : opts.low ? 245 : front ? 245 : 237;
  const rails = smithRails({ view: 'side', x: railX, top: 44 });
  const rackArm = (bar: Vec2, dx: number, side: Vec2): LimbSpec => ({
    target: add(bar, [dx, 10]), side, hand: -90,
  });
  return {
    id: opts.id,
    name: opts.name,
    tl: squatTL,
    meta: { en: opts.en, family: 'squat', equipment: ['smith', 'barbell'], sources: opts.sources },
    muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.4 }, { m: 'abs', scale: 0.3 }],
    props: (pal) => ({ back: rails.draw(pal) }),
    propsBox: rails.box,
    dynamic: [barbell<Joints>({ view: 'side', plate: 'medium', at: (_J, t) => ({ p: [railX, lerp(topY, bottomY, squatTL.at(t).p)] }) })],
    pose(t) {
      const p = squatTL.at(t).p;
      const thoracic = lerp(-91, front ? -69 : opts.low ? -48 : -55, p);
      const lumbar = lerp(-88, front ? -65 : opts.low ? -45 : -51, p);
      const spine = { lumbar, thoracic };
      const bar: Vec2 = [railX, lerp(topY, bottomY, p)];
      const anterior = dir(thoracic + 90);
      // Rear rack: shoulder lies anterior of the bar. Front rack: bar lies anterior of the shoulder.
      const shoulder = add(bar, mul(anterior, front ? -15 : 15));
      const hip = hipForShoulder(shoulder, spine);
      const nearWrist = add(bar, [front ? 2 : 0, 10]);
      return {
        hip, spine, neck: lerp(-87, front ? -75 : -64, p), head: lerp(-90, front ? -82 : -75, p),
        legs: standLegs(xFoot, opts.chair ? -5 : -4),
        arms: {
          near: front ? rackArm(nearWrist, 0, [1, 0]) : rackArm(nearWrist, 0, [-1, 0]),
          far: front
            ? rackArm(add(nearWrist, [-4, -2]), 0, [1, 0])
            : rackArm(add(nearWrist, [-4, -2]), 0, [-1, 0]),
        },
      };
    },
  };
}
