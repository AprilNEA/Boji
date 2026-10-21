// Shared side-view calf raise poses for the calf-raise-1 work list.
// The working forefoot stays on the floor or platform while the heel and body rise together.
// Seated variants keep the bench and forefoot block fixed; donkey variants keep both hands on the support.
import type { LibraryMeta, MovingPart, PropShape, Props, SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { BODY, type Joints, type LimbPair, type LimbSpec, type Pose } from '@/rig/side.ts';
import { A, G, handOnHip } from '@/exercises/common.ts';
import {
  aerobicStep, bandCurve, bandLine, barbell, cableColumn, cableHandle, cableLine, dumbbell,
  flatBench, gripAt, stabilityBall, towardCable, workTL,
} from '@/exercises/equipment/index.ts';

export interface CalfBase {
  id: string;
  name: string;
  meta: LibraryMeta;
}

type StandingArms = 'hips' | 'wall' | 'dumbbells' | 'dumbbell-single' | 'dumbbell-wall' | 'barbell' | 'band';

interface StandingConfig extends CalfBase {
  arms?: StandingArms;
  single?: boolean;
  baseH?: number;
  start?: number;
  top?: number;
  props?: (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => Props;
  propsBox?: [number, number];
  footBand?: boolean;
}

const X0 = 270;
const WALL_FACE = 350;
const WALL_HAND: Vec2 = [WALL_FACE - 2, 196];

/** Height and x shift of the ankle when the ball of the foot is the fixed contact. */
function ballContact(a: number): { dx: number; h: number } {
  const r = a * Math.PI / 180;
  return { dx: 40 - (40 * Math.cos(r) - 13 * Math.sin(r)), h: 40 * Math.sin(r) + 13 * Math.cos(r) };
}

/** A folded non-working leg, clearly held off the ground behind the working leg. */
function liftedLeg(): LimbSpec {
  return { a1: 115, a2: -20, foot: -5 };
}

function standingBody(p: number, config: Pick<StandingConfig, 'single' | 'baseH' | 'start' | 'top'>): Omit<Pose, 'arms'> {
  const a = lerp(config.start ?? 0, config.top ?? 34, p);
  const { dx, h } = ballContact(a);
  const floor = G - (config.baseH ?? 0);
  const near: LimbSpec = { target: [X0 + dx, floor - h], foot: a, side: [1, 0] };
  const far: LimbSpec = config.single
    ? liftedLeg()
    : { target: [X0 - 3 + dx, floor - h], foot: a, side: [1, 0] };
  return {
    hip: [X0 + dx, floor - h - BODY.thigh - BODY.shin],
    spine: { lumbar: -89, thoracic: -91 }, neck: -86, head: -88,
    legs: { near, far },
  };
}

/** Use palette colors rather than the placeholder in wallProps. */
function paletteWallProps(pal: Parameters<NonNullable<SideExercise['props']>>[0], face = WALL_FACE): Props {
  return {
    back: [
      { kind: 'box', nm: 'wall', color: pal.prop, c: [face + 31, (G + 30) / 2], s: [62, G - 30], r: 6 },
      { kind: 'box', nm: 'baseboard', color: pal.propDark, c: [face + 31, G - 8], s: [62, 16], r: 2 },
    ],
  };
}

function mergeProps(a: Props | undefined, b: Props | undefined): Props {
  return { back: [...(a?.back ?? []), ...(b?.back ?? [])], front: [...(a?.front ?? []), ...(b?.front ?? [])] };
}

function standingArms(mode: StandingArms): LimbPair {
  switch (mode) {
    case 'wall':
      return {
        near: { target: WALL_HAND, side: [0, 1], hand: 0 },
        far: { target: add(WALL_HAND, [-4, -3]), side: [0, 1], hand: 0 },
      };
    case 'dumbbells':
      return {
        near: { a1: 90, a2: 90, hand: 90 },
        far: { a1: 92, a2: 92, hand: 92 },
      };
    case 'dumbbell-single':
      return { near: { a1: 90, a2: 90, hand: 90 }, far: handOnHip(-4) };
    case 'dumbbell-wall':
      return {
        near: { a1: 90, a2: 90, hand: 90 },
        far: { target: add(WALL_HAND, [-4, -3]), side: [0, 1], hand: 0 },
      };
    case 'barbell':
      return {
        near: { a1: 140, a2: -25, hand: -5 },
        far: { a1: 142, a2: -22, hand: -3 },
      };
    case 'band':
      return {
        near: { a1: 118, a2: -45, hand: 0 },
        far: { a1: 120, a2: -42, hand: 2 },
      };
    default:
      return { near: handOnHip(0), far: handOnHip(-4) };
  }
}

/** Readable side-view convention for a barbell across the upper back. */
function backRackBarbell(): MovingPart {
  return {
    nm: 'Back Rack Barbell', kind: 'rigid', z: 'underNearArm',
    shapes: (pal) => [
      { kind: 'box', nm: 'shaft', color: pal.metal, c: [0, 0], s: [84, 7], r: 3.5 },
      { kind: 'box', nm: 'left-collar', color: pal.metalDark, c: [-27, 0], s: [6, 16], r: 2 },
      { kind: 'box', nm: 'right-collar', color: pal.metalDark, c: [27, 0], s: [6, 16], r: 2 },
      { kind: 'oval', nm: 'left-plate', color: pal.plate, c: [-36, 0], s: [21, 32] },
      { kind: 'oval', nm: 'right-plate', color: pal.plate, c: [36, 0], s: [21, 32] },
    ],
    at: (J) => ({ p: add(J.S, [-3, 10]) }),
  };
}

export function
 standingCalves(config: StandingConfig): SideExercise {
  const tl = workTL(0.45);
  const mode = config.arms ?? 'hips';
  const dynamic: MovingPart[] = [];
  if (mode === 'dumbbells') dynamic.push(dumbbell('f', 'end'), dumbbell('n', 'end'));
  if (mode === 'dumbbell-single' || mode === 'dumbbell-wall') dynamic.push(dumbbell('n', 'end'));
  if (mode === 'barbell') dynamic.push(backRackBarbell());
  if (mode === 'band') {
    dynamic.push(
      bandLine<Joints>((J) => [add(J.ankle_n, mul(dir(J.foot_n.a), 36)), gripAt(J, 'n')], 'underNearArm', 'Near Band'),
      bandLine<Joints>((J) => [add(J.ankle_f, mul(dir(J.foot_f.a), 36)), gripAt(J, 'f')], 'overFarArm', 'Far Band'),
    );
  }
  if (config.footBand) {
    dynamic.push(bandCurve<Joints>((J) => {
      const toe = add(J.ankle_n, mul(dir(J.foot_n.a), 34));
      return [add(toe, [-10, -3]), add(toe, [3, -13]), add(toe, [18, -3]), add(toe, [7, 9]), add(toe, [-9, 4])];
    }, 'front', 'Foot Band'));
  }
  const usesWall = mode === 'wall' || mode === 'dumbbell-wall';
  return {
    ...config,
    tl,
    muscles: [{ m: 'calves', side: config.single ? 'near' : 'both' }],
    props: (pal) => mergeProps(config.props?.(pal), usesWall ? paletteWallProps(pal) : undefined),
    propsBox: usesWall ? [config.propsBox?.[0] ?? WALL_FACE, Math.max(config.propsBox?.[1] ?? WALL_FACE, WALL_FACE + 62)] : config.propsBox,
    dynamic,
    pose: (t) => ({ ...standingBody(tl.at(t).p, config), arms: standingArms(mode) }),
  } satisfies SideExercise;
}

interface SeatedConfig extends CalfBase {
  single?: boolean;
  load: 'barbell' | 'dumbbell' | 'hammer' | 'underhand';
  extendedFreeLeg?: boolean;
}

const BENCH = flatBench({ view: 'side', x: 175 });
const SEATED_STEP = aerobicStep({ x: 315, h: 31, w: 118 });
const SEATED_HIP: Vec2 = [175, G - 105];

function seatedFreeLeg(extended: boolean): LimbSpec {
  return extended ? { a1: 10, a2: 10, foot: 0 } : { target: [278, G - A], foot: 0, side: [1, 0] };
}

export function seatedCalves(config: SeatedConfig): SideExercise {
  const tl = workTL(0.45);
  const armHand = config.load === 'hammer' ? 0 : config.load === 'underhand' ? -90 : 90;
  const arm = (dx: number): LimbSpec => ({
    target: (J) => add(J.H, [42 + dx, 3]), side: [0, 1], hand: armHand,
  });
  const dynamic: MovingPart[] = config.load === 'barbell'
    ? [barbell({ view: 'side', plate: 'small', at: (J) => ({ p: gripAt(J, 'n') }) })]
    : [dumbbell('n', 'profile')];
  return {
    ...config,
    tl,
    muscles: [
      { m: 'calves', side: config.single ? 'near' : 'both' },
      { m: 'hamstrings', side: config.single ? 'near' : 'both', scale: 0.3 },
    ],
    props: (pal) => ({ back: [...BENCH.draw(pal), ...SEATED_STEP.draw(pal)] }),
    propsBox: [BENCH.box[0], SEATED_STEP.box[1]],
    dynamic,
    pose: (t) => {
      const a = lerp(-8, 30, tl.at(t).p);
      const { h } = ballContact(a);
      const ankle: Vec2 = [296, SEATED_STEP.top - h];
      return {
        hip: SEATED_HIP,
        spine: { lumbar: -96, thoracic: -98 }, neck: -92, head: -90,
        legs: {
          near: { target: ankle, foot: a, side: [1, 0] },
          far: config.single
            ? seatedFreeLeg(config.extendedFreeLeg ?? false)
            : { target: add(ankle, [-5, 0]), foot: a, side: [1, 0] },
        },
        arms: { near: arm(0), far: arm(-4) },
      };
    },
  } satisfies SideExercise;
}

export function cableStandingCalves(base: CalfBase, single: boolean): SideExercise {
  const tl = workTL(0.45);
  const column = cableColumn({ x: 380, pulleyY: 286, toward: -1 });
  const support: Vec2 = [column.pulley[0], 196];
  const grip = (J: Joints, side: 'n' | 'f') => gripAt(J, side);
  const dynamic: MovingPart[] = single ? [] : [
    cableLine<Joints>(column.pulley, (J) => grip(J, 'n'), 'Near Cable'),
    cableLine<Joints>(column.pulley, (J) => grip(J, 'f'), 'Far Cable'),
    cableHandle<Joints>('d', (J) => ({ p: grip(J, 'n'), a: towardCable(grip(J, 'n'), column.pulley) })),
    cableHandle<Joints>('d', (J) => ({ p: grip(J, 'f'), a: towardCable(grip(J, 'f'), column.pulley) })),
  ];
  const arms: LimbPair = single
    ? {
      near: { target: support, side: [0, 1], hand: 0 },
      far: { target: add(support, [-4, -3]), side: [0, 1], hand: 0 },
    }
    : {
      near: { target: [330, 247], side: [0, 1], hand: 0 },
      far: { target: [326, 244], side: [0, 1], hand: 2 },
    };
  return {
    ...base,
    tl,
    muscles: [{ m: 'calves', side: single ? 'near' : 'both' }],
    props: (pal) => ({ back: column.draw(pal) }),
    propsBox: [column.box[0], column.box[1]],
    dynamic,
    pose: (t) => ({ ...standingBody(tl.at(t).p, { single }), arms }),
  } satisfies SideExercise;
}

export function donkeyCalves(base: CalfBase, single: boolean): SideExercise {
  const tl = workTL(0.45);
  const step = aerobicStep({ x: 305, h: 31, w: 130 });
  const supportFace = 432;
  const support: Vec2 = [supportFace - 2, 225];
  return {
    ...base,
    tl,
    muscles: [{ m: 'calves', side: single ? 'near' : 'both' }, { m: 'hamstrings', side: 'both', scale: 0.3 }],
    props: (pal) => mergeProps({ back: step.draw(pal) }, paletteWallProps(pal, supportFace)),
    propsBox: [step.box[0], supportFace + 62],
    pose: (t) => {
      const a = lerp(-8, 30, tl.at(t).p);
      const { dx, h } = ballContact(a);
      const floor = step.top;
      return {
        hip: [X0 + dx, floor - h - BODY.thigh - BODY.shin],
        farHip: 0,
        spine: { lumbar: -48, thoracic: -46 }, neck: -43, head: -42,
        legs: {
          near: { target: [X0 + dx, floor - h], foot: a, side: [1, 0] },
          far: single ? liftedLeg() : { target: [X0 + dx, floor - h], foot: a, side: [1, 0] },
        },
        arms: {
          near: { target: support, side: [0, 1], hand: 0 },
          far: { target: add(support, [-4, -3]), side: [0, 1], hand: 0 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Rock from a heel raise through neutral into a toe raise, without bending the knees. */
export function rockingBarbellCalves(base: CalfBase): SideExercise {
  const tl = timeline([
    { d: 0.9, from: 0, to: 1, e: [0.35, 1] },
    { d: 0.35, from: 1, to: 1, e: [1, 0.9] },
    { d: 1.2, from: 1, to: 0, e: [0.85, 0.45] },
    { d: 0.9, from: 0, to: -1, e: [0.35, 0.8] },
    { d: 0.35, from: -1, to: -1, e: [0.8, 0.75] },
    { d: 1.2, from: -1, to: 0, e: [0.7, 0.35] },
  ]);
  const heelContact = (a: number): number => {
    const r = a * Math.PI / 180;
    return -13 * Math.sin(r) + 13 * Math.cos(r);
  };
  return {
    ...base,
    tl,
    muscles: [{ m: 'calves', side: 'both' }],
    dynamic: [backRackBarbell()],
    pose: (t) => {
      const v = tl.at(t).p;
      const a = v >= 0 ? 34 * v : 22 * v;
      const contact = v >= 0 ? ballContact(a) : { dx: 0, h: heelContact(a) };
      return {
        hip: [X0 + contact.dx, G - contact.h - BODY.thigh - BODY.shin],
        spine: { lumbar: -89, thoracic: -91 }, neck: -86, head: -88,
        legs: {
          near: { target: [X0 + contact.dx, G - contact.h], foot: a, side: [1, 0] },
          far: { target: [X0 - 3 + contact.dx, G - contact.h], foot: a, side: [1, 0] },
        },
        arms: standingArms('barbell'),
      };
    },
  } satisfies SideExercise;
}

export function barbellFloorCalves(base: CalfBase): SideExercise {
  const shaft: PropShape[] = [
    { kind: 'box', nm: 'barbell-shaft', color: '#777777', c: [X0 + 28, G - 10], s: [112, 16], r: 8 },
    { kind: 'oval', nm: 'barbell-collar', color: '#555555', c: [X0 - 18, G - 10], s: [13, 24] },
    { kind: 'oval', nm: 'barbell-collar', color: '#555555', c: [X0 + 74, G - 10], s: [13, 24] },
  ];
  return standingCalves({
    ...base,
    baseH: 10, start: -6, top: 28,
    props: (pal) => ({
      back: shaft.map((shape) => ({ ...shape, color: shape.nm === 'barbell-shaft' ? pal.metal : pal.metalDark })),
    }),
    propsBox: [X0 - 35, X0 + 90],
  });
}

export function dumbbellHandleCalves(base: CalfBase): SideExercise {
  return standingCalves({
    ...base,
    single: true, arms: 'wall', baseH: 15, start: -8, top: 29,
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'dumbbell-handle', color: pal.metal, c: [X0 + 29, G - 12], s: [66, 12], r: 6 },
        { kind: 'oval', nm: 'dumbbell-plate-a', color: pal.plate, c: [X0 - 9, G - 12], s: [28, 28] },
        { kind: 'oval', nm: 'dumbbell-plate-b', color: pal.plate, c: [X0 + 67, G - 12], s: [28, 28] },
      ],
    }),
    propsBox: [X0 - 25, WALL_FACE + 62],
  });
}

/** A single working forefoot rolls over a dumbbell while the other hand holds a wall. */
export function dumbbellOnHandleCalves(base: CalfBase): SideExercise {
  return standingCalves({
    ...base,
    single: true, arms: 'dumbbell-wall', baseH: 15, start: -8, top: 29,
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'dumbbell-handle', color: pal.metal, c: [X0 + 29, G - 12], s: [66, 12], r: 6 },
        { kind: 'oval', nm: 'dumbbell-plate-a', color: pal.plate, c: [X0 - 9, G - 12], s: [28, 28] },
        { kind: 'oval', nm: 'dumbbell-plate-b', color: pal.plate, c: [X0 + 67, G - 12], s: [28, 28] },
      ],
    }),
    propsBox: [X0 - 25, WALL_FACE + 62],
  });
}

/** Both forefeet rest on a low board while two dumbbells hang at the sides. */
export function dumbbellStandingCalves(base: CalfBase): SideExercise {
  return standingCalves({
    ...base,
    arms: 'dumbbells', baseH: 12, start: -15, top: 20,
    props: (pal) => ({
      back: [{ kind: 'box', nm: 'wooden-board', color: pal.propDark, c: [X0 + 18, G - 6], s: [104, 12], r: 2 }],
    }),
    propsBox: [X0 - 34, X0 + 70],
  });
}

export function wallBallDumbbellCalves(base: CalfBase): SideExercise {
  const tl = workTL(0.45);
  const ballAt: Vec2 = [242, G - 174];
  return {
    ...base,
    tl,
    muscles: [{ m: 'calves', side: 'both' }, { m: 'adductors', side: 'far', scale: 0.35 }],
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'wall', color: pal.prop, c: [146, (G + 30) / 2], s: [62, G - 30], r: 6 },
        { kind: 'box', nm: 'baseboard', color: pal.propDark, c: [146, G - 8], s: [62, 16], r: 2 },
      ],
    }),
    propsBox: [115, 320],
    dynamic: [
      stabilityBall<Joints>(() => ({ p: ballAt }), 'back'),
      dumbbell('f', 'end'), dumbbell('n', 'end'),
      {
        nm: 'Knee Squeeze Ball', kind: 'rigid', z: 'front',
        shapes: (pal) => [{ kind: 'oval', nm: 'tennis-ball', color: pal.accent, c: [0, 0], s: [20, 20] }],
        at: (J) => ({ p: add(J.knee_n, [-4, 4]) }),
      },
    ],
    pose: (t) => {
      const p = tl.at(t).p;
      const a = 34 * p;
      const { dx, h } = ballContact(a);
      const x = 314;
      return {
        hip: [x + dx, G - h - BODY.thigh - BODY.shin],
        spine: { lumbar: -89, thoracic: -91 }, neck: -86, head: -88,
        legs: {
          near: { target: [x + dx, G - h], foot: a, side: [1, 0] },
          far: { target: [x - 3 + dx, G - h], foot: a, side: [1, 0] },
        },
        arms: standingArms('dumbbells'),
      };
    },
  } satisfies SideExercise;
}
