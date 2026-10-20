// Shared side-view builders for the pullover family.
// The helpers keep the shoulder arc, bench contact, fixed feet, and moving implement tied to the solved rig.
import type { LibraryMeta, MovingPart, Props, SideExercise } from '@/exercise.ts';
import { add, ang, dir, lerp, mul, sub, timeline, type Timeline, type Vec2 } from '@/math.ts';
import { solve, type Joints, type LimbPair, type Pose } from '@/rig.ts';
import { A, ARM_STRAIGHT, G, GRIP_IN_HAND, hipForShoulder, standLegs } from '@/exercises/common.ts';
import {
  backrestAt,
  barbell,
  baseRail,
  cableColumn,
  cableHandle,
  cableLine,
  declineBench,
  dumbbell,
  ezBar,
  flatBench,
  grip,
  gripAt,
  hub,
  inclineBench,
  leverArm,
  pad,
  seatPad,
  stabilityBall,
  towardCable,
  handleEnd,
  tube,
  weightStack,
  workTL,
} from '@/exercises/equipment/index.ts';

type Weight = 'barbell' | 'ez-bar' | 'dumbbell';
type Meta = LibraryMeta;

interface WeightPulloverOptions {
  id: string;
  name: string;
  meta: Meta;
  weight: Weight;
  bent: boolean;
  crossBench?: boolean;
}

interface DeclinePulloverOptions {
  id: string;
  name: string;
  meta: Meta;
  bent: boolean;
  wide?: boolean;
}

const normalTL = workTL(0.35);
// Leave less than half a pixel of reach slack. This reads as a straight arm without triggering IK at full extension.
const STRAIGHT_GRIP_RADIUS = ARM_STRAIGHT + GRIP_IN_HAND - 0.35;

/** Center of the held implement. The arm traces a constant-radius shoulder arc. */
const shoulderArc = (J: Joints, p: number, radius: number, start: number, end: number): Vec2 =>
  add(J.S, mul(dir(lerp(start, end, p)), radius));

/** Both hands grip the same implement. The far hand shifts only by the far-shoulder offset. */
function twoHandArms(grip: (J: Joints) => Vec2, elbowSide: Vec2 = [1, 0.35]): Pose['arms'] {
  const handAngle = (J: Joints): number => ang(sub(grip(J), J.S));
  // The palm points along the arm, so the gripped implement sits beyond the wrist rather than shortening the reach.
  const nearWrist = (J: Joints): Vec2 => sub(grip(J), mul(dir(handAngle(J)), GRIP_IN_HAND));
  return {
    near: { target: nearWrist, side: elbowSide, hand: handAngle },
    far: {
      target: (J) => add(nearWrist(J), sub(J.Sf, J.S)),
      side: elbowSide,
      hand: handAngle,
    },
  };
}

function heldWeight(weight: Weight): MovingPart[] {
  switch (weight) {
    case 'barbell':
      return [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })];
    case 'ez-bar':
      return [ezBar({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })];
    case 'dumbbell':
      return [dumbbell('n', 'profile')];
  }
}

/** Flat-bench body position, with the upper back supported and both feet flat. */
function flatBase(crossBench = false): Omit<Pose, 'arms'> {
  if (crossBench) {
    return {
      // Only the upper back rests on the short bench. The hips stay below the pad and the knees remain bent.
      hip: [270, 370], spine: { lumbar: -168, thoracic: -168 }, neck: -168, head: -168,
      legs: {
        near: { target: [390, G - A], foot: 0, side: [0, -1] },
        far: { target: [384, G - A], foot: 0, side: [0, -1] },
      },
    };
  }
  return {
    hip: [284, 342], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
    legs: {
      near: { target: [365, G - A], foot: 0, side: [0, -1] },
      far: { target: [359, G - A], foot: 0, side: [0, -1] },
    },
  };
}

/** A flat pullover keeps the torso and elbows fixed while the shoulders move the load over and behind the head. */
export function flatPullover(opts: WeightPulloverOptions): SideExercise {
  const base = flatBase(opts.crossBench);
  const bench = flatBench({ view: 'side', x: opts.crossBench ? 175 : 240, length: opts.crossBench ? 92 : undefined });
  const radius = opts.bent ? 118 : STRAIGHT_GRIP_RADIUS;
  const gripPoint = (J: Joints, p: number) => shoulderArc(J, p, radius, -90, -160);
  return {
    id: opts.id,
    name: opts.name,
    tl: normalTL,
    meta: opts.meta,
    muscles: [
      { m: 'lats' }, { m: 'pecs', scale: 0.65 }, { m: 'triceps', side: 'both', scale: opts.bent ? 0.3 : 0.45 },
    ],
    props: (pal) => ({ back: bench.draw(pal) }),
    propsBox: bench.box,
    dynamic: heldWeight(opts.weight),
    pose: (t) => {
      const p = normalTL.at(t).p;
      return { ...base, arms: twoHandArms((J) => gripPoint(J, p)) };
    },
  };
}

/** Decline bench position. The ankles remain in the roller while the shoulders make the pullover arc. */
export function declineBarPullover(opts: DeclinePulloverOptions): SideExercise {
  const bench = declineBench({ x: 115, angle: 20, low: 70, length: 220 });
  const radius = opts.bent ? 118 : STRAIGHT_GRIP_RADIUS;
  const base: Omit<Pose, 'arms'> = {
    hip: [254, 316], spine: { lumbar: 160, thoracic: 160 }, neck: 160, head: 160,
    // The knees point down, not through the bench. The shoes hook under the roller at the high end.
    legs: {
      near: { target: [335, 310], foot: 160, side: [0, 1] },
      far: { target: [331, 312], foot: 160, side: [0, 1] },
    },
  };
  const gripPoint = (J: Joints, p: number) => shoulderArc(J, p, radius, -110, -170);
  return {
    id: opts.id,
    name: opts.name,
    tl: normalTL,
    meta: opts.meta,
    muscles: [
      { m: 'lats' }, { m: 'pecs', scale: opts.wide ? 0.8 : 0.6 }, { m: 'triceps', side: 'both', scale: 0.35 },
    ],
    props: (pal) => ({ back: bench.draw(pal) }),
    propsBox: bench.box,
    dynamic: heldWeight('barbell'),
    pose: (t) => {
      const p = normalTL.at(t).p;
      return { ...base, arms: twoHandArms((J) => gripPoint(J, p), [0.7, 0.7]) };
    },
  };
}

interface CableStandingOptions {
  id: string;
  name: string;
  meta: Meta;
  rope: boolean;
  staggered?: boolean;
  wide?: boolean;
}

/** Standing cable pulldown. The torso stays fixed at a 30° hip hinge and the elbows keep their soft bend. */
export function standingCablePulldown(opts: CableStandingOptions): SideExercise {
  const column = cableColumn({ x: 420, pulleyY: 70, toward: -1 });
  const tl = workTL(0.3);
  const base: Omit<Pose, 'arms'> = opts.staggered
    ? {
      hip: [225, 260], spine: { lumbar: -60, thoracic: -60 }, neck: -60, head: -60,
      legs: {
        near: { target: [247, G - A], foot: 0, side: [1, 0] },
        far: { target: [203, G - A], foot: 0, side: [1, 0] },
      },
    }
    : {
      hip: [230, 257], spine: { lumbar: -60, thoracic: -60 }, neck: -60, head: -60,
      legs: standLegs(230, 0),
    };
  const gripPoint = (J: Joints, p: number) => shoulderArc(J, p, STRAIGHT_GRIP_RADIUS, -38, 65);
  const attachment = (J: Joints, t: number) => {
    const g = gripAt(J, 'n');
    return towardCable(g, column.pulley);
  };
  return {
    id: opts.id,
    name: opts.name,
    tl,
    meta: opts.meta,
    muscles: [{ m: 'lats' }, { m: 'abs', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: column.draw(pal) }),
    propsBox: [180, column.box[1]],
    dynamic: [
      cableLine(column.pulley, (J, t) => handleEnd(gripAt(J, 'n'), attachment(J, t))),
      cableHandle(opts.rope ? 'rope' : 'bar', (J, t) => ({
        p: gripAt(J, 'n'), a: attachment(J, t),
      }), opts.rope ? { spread: 14 } : { len: opts.wide ? 112 : 78 }),
    ],
    pose: (t) => {
      const p = tl.at(t).p;
      return { ...base, arms: twoHandArms((J) => gripPoint(J, p), [1, 0.25]) };
    },
  };
}

/** Lying rope pullover. The high pulley sits behind the head, so the cable stays clear of the torso. */
export function lyingCablePullover(id: string, name: string, meta: Meta): SideExercise {
  const bench = flatBench({ view: 'side', x: 240 });
  const column = cableColumn({ x: 40, pulleyY: 90, toward: 1 });
  const tl = workTL(0.35);
  const base = flatBase(false);
  const gripPoint = (J: Joints, p: number) => shoulderArc(J, p, STRAIGHT_GRIP_RADIUS, -90, -160);
  const attachment = (J: Joints): number => towardCable(gripAt(J, 'n'), column.pulley);
  return {
    id,
    name,
    tl,
    meta,
    muscles: [{ m: 'lats' }, { m: 'triceps', side: 'both', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: [...column.draw(pal), ...bench.draw(pal)] }),
    propsBox: [column.box[0], bench.box[1]],
    dynamic: [
      cableLine(column.pulley, (J) => handleEnd(gripAt(J, 'n'), attachment(J))),
      cableHandle('rope', (J) => ({ p: gripAt(J, 'n'), a: attachment(J) }), { spread: 14 }),
    ],
    pose: (t) => {
      const p = tl.at(t).p;
      return { ...base, arms: twoHandArms((J) => gripPoint(J, p)) };
    },
  };
}

/** Reclined cable pushdown. The back is on the incline bench and the cable comes from behind the head. */
export function inclineCablePulldown(id: string, name: string, meta: Meta): SideExercise {
  const bench = inclineBench({ x: 270, angle: 35, facing: 1 });
  const column = cableColumn({ x: 62, pulleyY: 88, toward: 1 });
  const tl = workTL(0.35);
  const base: Omit<Pose, 'arms'> = {
    hip: [279, 349], spine: { lumbar: -145, thoracic: -145 }, neck: -145, head: -145,
    legs: {
      near: { target: [360, G - A], foot: 0, side: [0, -1] },
      far: { target: [354, G - A], foot: 0, side: [0, -1] },
    },
  };
  // At p=0 the bar is just above the upper thighs. At p=1 it is overhead and behind the head.
  const gripPoint = (J: Joints, p: number) => shoulderArc(J, p, STRAIGHT_GRIP_RADIUS, 40, -135);
  const attachment = (J: Joints): number => towardCable(gripAt(J, 'n'), column.pulley);
  return {
    id,
    name,
    tl,
    meta,
    muscles: [{ m: 'lats' }, { m: 'triceps', side: 'both', scale: 0.35 }, { m: 'delts', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: [...column.draw(pal), ...bench.draw(pal)] }),
    propsBox: [column.box[0], bench.box[1]],
    dynamic: [
      cableLine(column.pulley, (J) => handleEnd(gripAt(J, 'n'), attachment(J))),
      cableHandle('bar', (J) => ({ p: gripAt(J, 'n'), a: attachment(J) }), { len: 78 }),
    ],
    pose: (t) => {
      const p = tl.at(t).p;
      return { ...base, arms: twoHandArms((J) => gripPoint(J, p), [0.9, 0.45]) };
    },
  };
}

interface BallPulloverOptions {
  id: string;
  name: string;
  meta: Meta;
  hipExtension?: boolean;
}

/** Upper-back stability-ball support. Feet remain planted and the shoulders make the full pullover arc. */
export function ballPullover(opts: BallPulloverOptions): SideExercise {
  const tl = opts.hipExtension
    ? timeline([
      { d: 0.9, from: 0, to: 1, e: [0.35, 0.9] },
      { d: 1.1, from: 1, to: 0, e: [0.9, 1] },
      { d: 0.5, from: 0, to: 0, e: [1, 0.85] },
      { d: 1.15, from: 0, to: 0, e: [0.85, 0.35] },
    ])
    : normalTL;
  const ball: MovingPart[] = [stabilityBall(() => ({ p: [180, G - 68] }))];
  const gripPoint = (J: Joints, p: number) => shoulderArc(J, p, STRAIGHT_GRIP_RADIUS, -90, -160);
  // The first two timeline spans take exactly 2.0 of the 3.65-second sequence.
  // Start hip extension only after the dumbbell has returned over the chest.
  const pulloverEnd = 2 / 3.65;
  const hipExtension = (t: number): number => {
    if (!opts.hipExtension || t < pulloverEnd) return 0;
    return Math.sin((t - pulloverEnd) / (1 - pulloverEnd) * Math.PI);
  };
  return {
    id: opts.id,
    name: opts.name,
    tl,
    meta: opts.meta,
    ...(opts.hipExtension ? { poster: pulloverEnd + (1 - pulloverEnd) / 2 } : {}),
    muscles: opts.hipExtension
      ? [{ m: 'pecs' }, { m: 'lats', scale: 0.6 }, { m: 'glutes', scale: 0.85 }, { m: 'abs', scale: 0.5 }]
      : [{ m: 'pecs' }, { m: 'lats', scale: 0.65 }, { m: 'triceps', side: 'both', scale: 0.35 }],
    dynamic: [...ball, dumbbell('n', 'profile')],
    pose: (t) => {
      const extension = hipExtension(t);
      // Keep the upper back on the ball. The pelvis rises while the torso becomes level,
      // rather than translating the whole body away from its support.
      const spineAngle = opts.hipExtension ? lerp(-160, -180, extension) : 180;
      const spine = { lumbar: spineAngle, thoracic: spineAngle };
      const base: Omit<Pose, 'arms'> = {
        hip: opts.hipExtension ? hipForShoulder([177, 304], spine) : [285, 306],
        spine, neck: spineAngle, head: spineAngle,
        legs: {
          near: { target: [285, G - A], foot: 0, side: [0, -1] },
          far: { target: [279, G - A], foot: 0, side: [0, -1] },
        },
      };
      // The first motion is the pullover. The later hip-extension phase keeps the dumbbell above the chest.
      const p = opts.hipExtension && t >= pulloverEnd ? 0 : tl.at(t).p;
      return { ...base, arms: twoHandArms((J) => gripPoint(J, p)) };
    },
  };
}

/** One dumbbell alternates between arms on the stability ball; each side gets a complete shoulder arc. */
export function singleArmBallPullover(id: string, name: string, meta: Meta): SideExercise {
  const tl = timeline([
    { d: 0.8, from: 0, to: 1, e: [0.35, 1] },
    { d: 0.3, from: 1, to: 1, e: [1, 0.9] },
    { d: 0.8, from: 1, to: 0, e: [0.9, 0.4] },
    { d: 0.8, from: 0, to: 1, e: [0.35, 1] },
    { d: 0.3, from: 1, to: 1, e: [1, 0.9] },
    { d: 0.8, from: 1, to: 0, e: [0.9, 0.35] },
  ]);
  const activeNear = (t: number): boolean => t < 0.5;
  const repetitionProgress = (t: number): number => tl.at(t < 0.5 ? t : t - 0.5).p;
  const oneDumbbell: MovingPart = {
    nm: 'Alternating Dumbbell', kind: 'rigid', z: 'underNearArm',
    shapes: (pal) => [
      { kind: 'box', nm: 'handle', color: pal.metal, c: [0, 0], s: [24, 5], r: 2.5 },
      { kind: 'box', nm: 'plate-a', color: pal.plate, c: [-16, 0], s: [9, 30], r: 3 },
      { kind: 'box', nm: 'plate-b', color: pal.plate, c: [16, 0], s: [9, 30], r: 3 },
    ],
    at: (J, t) => ({ p: gripAt(J, activeNear(t) ? 'n' : 'f'), a: 90 }),
  };
  return {
    id,
    name,
    tl,
    meta,
    muscles: [{ m: 'pecs', side: 'both' }, { m: 'lats', scale: 0.6 }, { m: 'triceps', side: 'both', scale: 0.35 }],
    dynamic: [stabilityBall(() => ({ p: [180, G - 68] })), oneDumbbell],
    pose: (t) => {
      const p = repetitionProgress(t);
      const base: Omit<Pose, 'arms'> = {
        hip: [285, 306], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
        legs: {
          near: { target: [285, G - A], foot: 0, side: [0, -1] },
          far: { target: [279, G - A], foot: 0, side: [0, -1] },
        },
      };
      const active = activeNear(t);
      const arm = (side: 'near' | 'far') => {
        const isActive = side === 'near' ? active : !active;
        const armAngle = isActive ? lerp(-90, -160, p) : -90;
        return {
          target: (J: Joints) => {
            const shoulder = side === 'near' ? J.S : J.Sf;
            const g = add(shoulder, mul(dir(armAngle), STRAIGHT_GRIP_RADIUS));
            return sub(g, mul(dir(armAngle), GRIP_IN_HAND));
          },
          side: [1, 0.35] as Vec2,
          hand: armAngle,
        };
      };
      return { ...base, arms: { near: arm('near'), far: arm('far') } };
    },
  };
}

/** Seated leverage pullover: the handles travel from overhead to the chest along a fixed machine lever. */
export function machinePullover(id: string, name: string, meta: Meta): SideExercise {
  const tl = workTL(0.35);
  const base: Omit<Pose, 'arms'> = {
    hip: [235, G - 104], spine: { lumbar: -97, thoracic: -99 }, neck: -92, head: -90,
    legs: {
      near: { target: [335, G - A], foot: 0, side: [0, -1] },
      far: { target: [329, G - A], foot: 0, side: [0, -1] },
    },
  };
  const probe = solve({ ...base, arms: { near: { a1: 0, a2: 0 }, far: { a1: 0, a2: 0 } } });
  const rest = backrestAt(probe, 0.55, 9, [18, 154], 12);
  const pivot: Vec2 = [168, 281];
  const armLength = 188;
  const startA = -61.5, endA = -5.8;
  const handlePoint = (p: number): Vec2 => add(pivot, mul(dir(lerp(startA, endA, p)), armLength));
  const stack = weightStack({ x: 90, top: 100, lift: (t) => 26 * tl.at(t).p });
  const staticProps = (pal: Parameters<typeof tube>[0]): Props => ({
    back: [
      ...stack.fixed(pal),
      baseRail(pal, stack.box[0], 350),
      tube(pal, 'stack-link', [stack.box[1] - 3, 180], [pivot[0] - 6, 180], { dark: true, w: 10 }),
      tube(pal, 'pivot-post', [pivot[0], G - 6], pivot, { w: 15 }),
      tube(pal, 'back-post', [rest.c[0] - 12, G - 8], [rest.c[0] - 12, rest.c[1]], { dark: true, w: 13 }),
      tube(pal, 'seat-post', [240, G - 6], [240, G - 88], { dark: true, w: 13 }),
      pad(pal, 'backrest', rest.c, rest.size, rest.rot),
      seatPad(pal, 242, G - 79, 94),
      ...hub(pal, 'lever-pivot', pivot, 24),
    ],
  });
  return {
    id,
    name,
    tl,
    meta,
    muscles: [{ m: 'lats' }, { m: 'triceps', side: 'both', scale: 0.4 }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: staticProps,
    propsBox: [stack.box[0], 356],
    dynamic: [
      stack.dynamic,
      leverArm({
        nm: 'Pullover Lever', pivot, length: armLength, z: 'underNearArm',
        angle: (_J, t) => lerp(startA, endA, tl.at(t).p),
        extra: (pal) => [grip(pal, 'pullover-handle', [armLength, 0], 34, 90)],
      }),
    ],
    pose: (t) => {
      const p = tl.at(t).p;
      return { ...base, arms: twoHandArms(() => handlePoint(p), [1, 0.4]) };
    },
  };
}
