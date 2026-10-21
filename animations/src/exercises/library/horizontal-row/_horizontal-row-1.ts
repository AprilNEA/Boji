// Private builders for horizontal-row-1 exercises.
// Each builder keeps the fixed support point stable and moves the grip through a controlled row.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp, lerpV, mul, type Vec2 } from '@/math/vec2.ts';
import type { LimbPair } from '@/rig/side.ts';
import { G, A, GRIP_IN_HAND, standLegs } from '@/exercises/common.ts';
import {
  bandLine, barbell, cableColumn, cableHandle, cableLine, dumbbell, flatBench, gripAt, inclineBench,
  pullUpBar, towardCable, workTL,
} from '@/exercises/equipment/index.ts';

type Meta = SideExercise['meta'];
type Base = { id: string; name: string; meta: NonNullable<Meta> };

const ROW_TL = workTL(0.35);
const rowMuscles = [{ m: 'upperBack' as const }, { m: 'lats' as const, scale: 0.75 }, { m: 'biceps' as const, side: 'both' as const, scale: 0.55 }];
const oneArmMuscles = [{ m: 'upperBack' as const }, { m: 'lats' as const, scale: 0.75 }, { m: 'biceps' as const, side: 'near' as const, scale: 0.6 }, { m: 'obliques' as const, scale: 0.35 }];

/** Stable hip hinge. Normal rows start with long arms; Pendlay rows reset their medium plates on the floor. */
export function bentBarRow(base: Base, opts: { single?: boolean; reverse?: boolean; pendlay?: boolean; bench?: boolean; dumbbell?: boolean } = {}): SideExercise {
  // A normal row has a 58° torso lean and only a small knee bend. A Pendlay row is lower and nearly parallel,
  // so the wrist starts 9 px above a 60 px plate that rests on GROUND.
  const hip: Vec2 = opts.bench ? [232, G - 270] : opts.pendlay ? [230, G - 157] : [232, G - 192];
  const spine = opts.pendlay ? { lumbar: -5, thoracic: -5 } : { lumbar: -31, thoracic: -33 };
  const wrist = (p: number): Vec2 => opts.bench
    ? [lerp(320, 292, p), lerp(250, 202, p)]
    : opts.pendlay
      ? [lerp(345, 300, p), lerp(G - 39, G - 102, p)]
      : [lerp(350, 320, p), lerp(320, 280, p)];
  const bench = opts.bench ? flatBench({ view: 'side', x: 232, top: 92, length: 190 }) : undefined;
  const farWrist = (J: any, p: number): Vec2 => add(wrist(p), opts.single ? [-10, 54] : add([-3, -2], [J.Sf[0] - J.S[0], J.Sf[1] - J.S[1]]));
  return {
    ...base, tl: ROW_TL, meta: base.meta, muscles: opts.single ? oneArmMuscles : rowMuscles,
    props: bench ? (pal) => ({ back: bench.draw(pal) }) : undefined,
    propsBox: bench?.box,
    dynamic: opts.dumbbell
      ? [dumbbell('n', 'profile')]
      : [barbell({ view: 'side', plate: opts.pendlay ? 'medium' : 'full', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose(t) {
      const p = ROW_TL.at(t).p;
      const y = opts.bench ? G - 92 - A : G - A;
      const feet: LimbPair = opts.bench ? {
        near: { target: [214, y] as Vec2, foot: 0, side: [1, 0] as Vec2 },
        far: { target: [224, y] as Vec2, foot: 0, side: [1, 0] as Vec2 },
      } : standLegs(226, 0);
      return {
        hip, spine, neck: opts.pendlay ? -5 : -35, head: opts.pendlay ? -5 : -32, legs: feet,
        arms: {
          near: { target: wrist(p), side: [-1, 0.2], hand: opts.reverse ? -90 : 90 },
          far: opts.single
            ? { target: (J) => add(J.Hf, [0, -12]), side: [-1, 0.2], hand: 90 }
            : { target: (J) => farWrist(J, p), side: [-1, 0.2], hand: opts.reverse ? -90 : 90 },
        },
      };
    },
  };
}

/** Seated low row. The legs stay braced while the torso remains tall and the handle returns to the abdomen. */
export function seatedRow(base: Base, opts: { band?: boolean; single?: boolean; wide?: boolean; elevated?: boolean; decline?: boolean; floor?: boolean } = {}): SideExercise {
  const hip: Vec2 = [158, G - (opts.elevated ? 108 : opts.floor ? 66 : 88)];
  const ankle: Vec2 = [326, G - (opts.elevated ? 80 : opts.floor ? 48 : 82)];
  const pulley: Vec2 = [382, ankle[1] - (opts.decline ? 12 : 0)];
  const column = opts.band ? undefined : cableColumn({ x: 405, pulleyY: pulley[1], toward: -1 });
  const seat = opts.floor ? undefined : flatBench({ view: 'side', x: 166, top: opts.elevated ? 112 : 82, length: 118 });
  const grip = (J: any, p: number): Vec2 => add(J.S, [lerp(118, 50, p), lerp(19, 47, p)]);
  return {
    ...base, tl: ROW_TL, meta: base.meta, muscles: opts.single ? oneArmMuscles : rowMuscles,
    props: (pal) => ({ back: [...(column?.draw(pal) ?? []), ...(seat?.draw(pal) ?? [])] }),
    propsBox: [opts.floor ? 80 : seat!.box[0], column?.box[1] ?? 405],
    dynamic: opts.band
      ? [bandLine((J) => [add(J.ankle_n, [4, -6]), gripAt(J, 'n')])]
      : [
          cableLine(pulley, (J) => gripAt(J, 'n')),
          cableHandle(opts.wide ? 'bar' : opts.single ? 'd' : 'vbar', (J) => ({ p: gripAt(J, 'n'), a: towardCable(gripAt(J, 'n'), pulley) }), { len: 96 }),
        ],
    pose(t) {
      const p = ROW_TL.at(t).p;
      return {
        hip, spine: { lumbar: lerp(-80, -91, p), thoracic: lerp(-82, -93, p) }, neck: -88, head: -90,
        legs: {
          near: { target: ankle, foot: -80, side: [0, -1] },
          far: { target: add(ankle, [-4, 2]), foot: -80, side: [0, -1] },
        },
        arms: {
          near: { target: (J) => grip(J, p), side: [-0.4, 1], hand: 10 },
          far: opts.single
            ? { target: (J) => add(J.Hf, [0, -12]), side: [-0.4, 1], hand: 80 }
            : { target: (J) => add(grip(J, p), [-5, -3]), side: [-0.4, 1], hand: 10 },
        },
      };
    },
  };
}

/** Standing cable or band row. The feet stay planted and the hand travels from the anchor to the ribs. */
export function standingRow(base: Base, opts: { band?: boolean; single?: boolean; vbar?: boolean; hinged?: boolean } = {}): SideExercise {
  const hip: Vec2 = [245, G - (opts.hinged ? 177 : 188)];
  const spine = opts.hinged ? { lumbar: -54, thoracic: -56 } : { lumbar: -90, thoracic: -90 };
  const pulley: Vec2 = [392, opts.hinged ? 252 : 208];
  const column = opts.band ? undefined : cableColumn({ x: 414, pulleyY: pulley[1], toward: -1 });
  const grip = (J: any, p: number): Vec2 => opts.hinged
    ? add(J.S, [lerp(104, 42, p), lerp(57, 67, p)])
    : add(J.S, [lerp(111, 42, p), lerp(34, 62, p)]);
  return {
    ...base, tl: ROW_TL, meta: base.meta, muscles: opts.single ? oneArmMuscles : rowMuscles,
    props: (pal) => ({ back: column?.draw(pal) ?? [] }), propsBox: [190, column?.box[1] ?? 414],
    dynamic: opts.band
      ? [bandLine((J) => [pulley, gripAt(J, 'n')])]
      : [
          cableLine(pulley, (J) => gripAt(J, 'n')),
          cableHandle(opts.vbar ? 'vbar' : opts.single ? 'd' : 'bar', (J) => ({ p: gripAt(J, 'n'), a: towardCable(gripAt(J, 'n'), pulley) }), { len: 84 }),
        ],
    pose(t) {
      const p = ROW_TL.at(t).p;
      return {
        hip, spine, neck: opts.hinged ? -56 : -90, head: opts.hinged ? -56 : -90, legs: standLegs(245, 0),
        arms: {
          near: { target: (J) => grip(J, p), side: [-1, 0.2], hand: 10 },
          far: opts.single
            ? { target: (J) => add(J.Hf, [0, -12]), side: [-1, 0.2], hand: 80 }
            : { target: (J) => add(grip(J, p), [-5, -3]), side: [-1, 0.2], hand: 10 },
        },
      };
    },
  };
}

/** Under-bar row. The bar and heels remain fixed; the rigid body rises toward the bar by elbow flexion. */
export function invertedRow(base: Base, opts: { bench?: boolean; bentKnee?: boolean } = {}): SideExercise {
  const bar: Vec2 = opts.bench ? [259, G - 138] : [264, G - 172];
  const station = opts.bench ? flatBench({ view: 'side', x: 260, top: 138, length: 210 }) : pullUpBar({ view: 'side', x: bar[0], y: bar[1] });
  return {
    ...base, tl: ROW_TL, meta: base.meta, muscles: rowMuscles,
    props: (pal) => ({ back: station.draw(pal) }), propsBox: station.box,
    pose(t) {
      const p = ROW_TL.at(t).p;
      const hip: Vec2 = opts.bentKnee
        ? [lerp(257, 278, p), lerp(G - 110, G - 135, p)]
        : [lerp(257, 278, p), lerp(G - 76, G - 111, p)];
      const ankle: Vec2 = opts.bentKnee ? [350, G - A] : [422, G - A];
      return {
        hip, spine: { lumbar: lerp(-157, -164, p), thoracic: lerp(-157, -164, p) }, neck: -160, head: -160,
        legs: {
          // A supine knee rises toward the ceiling. The former downward pole folded both knees toward the floor.
          near: { target: ankle, foot: 0, side: [0, -1] },
          far: { target: add(ankle, [-4, 1]), foot: 0, side: [0, -1] },
        },
        arms: {
          near: { target: [bar[0], bar[1] + GRIP_IN_HAND], side: [0, 1], hand: -90 },
          far: { target: [bar[0] - 3, bar[1] + GRIP_IN_HAND], side: [0, 1], hand: -90 },
        },
      };
    },
  };
}

/** Kneeling high-cable row. The knees stay on the floor while a high cable comes to the upper chest. */
export function kneelingRow(base: Base, opts: { single?: boolean; rope?: boolean; chest?: boolean } = {}): SideExercise {
  const hip: Vec2 = [230, G - 100];
  const pulley: Vec2 = [392, opts.chest ? 212 : 112];
  const column = cableColumn({ x: 414, pulleyY: pulley[1], toward: -1 });
  const grip = (J: any, p: number): Vec2 => add(J.S, [lerp(106, 43, p), lerp(opts.chest ? 24 : 2, 67, p)]);
  return {
    ...base, tl: ROW_TL, meta: base.meta, muscles: opts.single ? oneArmMuscles : rowMuscles,
    props: (pal) => ({ back: column.draw(pal) }), propsBox: [180, column.box[1]],
    dynamic: [
      cableLine(pulley, (J) => gripAt(J, 'n')),
      cableHandle(opts.rope ? 'rope' : opts.single ? 'd' : 'bar', (J) => ({ p: gripAt(J, 'n'), a: towardCable(gripAt(J, 'n'), pulley) }), { len: 82 }),
    ],
    pose(t) {
      const p = ROW_TL.at(t).p;
      return {
        hip, spine: { lumbar: -91, thoracic: -91 }, neck: -91, head: -91,
        legs: {
          near: { a1: 90, a2: 180, foot: 180 },
          far: { a1: 90, a2: 180, foot: 180 },
        },
        arms: {
          near: { target: (J) => grip(J, p), side: [-1, 0.2], hand: 5 },
          far: opts.single
            ? { target: (J) => add(J.Hf, [0, -12]), side: [-1, 0.2], hand: 80 }
            : { target: (J) => add(grip(J, p), [-6, -3]), side: [-1, 0.2], hand: 5 },
        },
      };
    },
  };
}

/** Chest-supported row on an incline bench. The torso stays on the pad while the bar moves beneath the chest. */
export function inclineRow(base: Base, opts: { cable?: boolean; reverse?: boolean } = {}): SideExercise {
  // The backrest rises toward the prone athlete's head at screen right, parallel to the 50° torso and about 20 px in
  // front of the spine line, so the chest rests on the pad. The feet stay on the floor behind the hips.
  const bench = inclineBench({ x: 220, top: 132, angle: 50, facing: -1, back: 165, seat: 72 });
  const hip: Vec2 = [230, G - A - 163];
  const pulley: Vec2 = [397, G - 108];
  const column = opts.cable ? cableColumn({ x: 418, pulleyY: pulley[1], toward: -1 }) : undefined;
  const grip = (J: any, p: number): Vec2 => lerpV(add(J.S, [2, 124]), add(J.B(0.3), mul(J.A(0.3), 16)), p);
  return {
    ...base, tl: ROW_TL, meta: base.meta, muscles: rowMuscles,
    props: (pal) => ({ back: [...bench.draw(pal), ...(column?.draw(pal) ?? [])] }),
    propsBox: [bench.box[0], column?.box[1] ?? bench.box[1]],
    dynamic: opts.cable
      ? [cableLine(pulley, (J) => gripAt(J, 'n')), cableHandle('bar', (J) => ({ p: gripAt(J, 'n'), a: towardCable(gripAt(J, 'n'), pulley) }), { len: 80 })]
      : [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose(t) {
      const p = ROW_TL.at(t).p;
      return {
        hip, spine: { lumbar: -50, thoracic: -52 }, neck: -53, head: -49,
        legs: { near: { target: [178, G - A], foot: 0, side: [1, 0] }, far: { target: [172, G - A], foot: 0, side: [1, 0] } },
        arms: {
          near: { target: (J) => grip(J, p), side: [-1, 0.2], hand: opts.reverse ? -90 : 90 },
          far: { target: (J) => add(grip(J, p), [J.Sf[0] - J.S[0] - 3, J.Sf[1] - J.S[1] - 2]), side: [-1, 0.2], hand: opts.reverse ? -90 : 90 },
        },
      };
    },
  };
}

/** Prone flat-bench row. The chest remains supported and the cambered bar moves up from below the pad. */
export function proneRow(base: Base): SideExercise {
  const bench = flatBench({ view: 'side', x: 250, top: 138, length: 225 });
  const grip = (p: number): Vec2 => [lerp(228, 214, p), lerp(G - 82, G - 122, p)];
  return {
    ...base, tl: ROW_TL, meta: base.meta, muscles: rowMuscles,
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }), nm: 'Cambered Barbell' })],
    pose(t) {
      const p = ROW_TL.at(t).p;
      return {
        // Prone on the flat pad: the head is right of the hips and the feet extend behind the body.
        hip: [205, G - 160], spine: { lumbar: 0, thoracic: 0 }, neck: 0, head: 0,
        legs: { near: { target: [106, G - A], foot: 180, side: [0, 1] }, far: { target: [100, G - A], foot: 180, side: [0, 1] } },
        arms: {
          near: { target: grip(p), side: [-1, 0.2], hand: 90 },
          far: { target: (J) => add(grip(p), [J.Sf[0] - J.S[0] - 3, J.Sf[1] - J.S[1] - 2]), side: [-1, 0.2], hand: 90 },
        },
      };
    },
  };
}

/** Bodyweight standing row on a fixed waist-high handle. The heels stay down and the torso leans back as one line. */
export function standingBodyRow(base: Base, opts: { single?: boolean; squat?: boolean } = {}): SideExercise {
  const bar: Vec2 = [308, G - 197];
  const station = pullUpBar({ view: 'side', x: bar[0], y: bar[1] });
  return {
    ...base, tl: ROW_TL, meta: base.meta, muscles: opts.single ? oneArmMuscles : rowMuscles,
    props: (pal) => ({ back: station.draw(pal) }), propsBox: station.box,
    pose(t) {
      const p = ROW_TL.at(t).p;
      const hip: Vec2 = [lerp(280, 310, p), lerp(G - (opts.squat ? 122 : 156), G - (opts.squat ? 152 : 177), p)];
      return {
        hip, spine: { lumbar: lerp(-118, -132, p), thoracic: lerp(-118, -132, p) }, neck: -128, head: -128,
        legs: standLegs(280, 0),
        arms: {
          near: { target: [bar[0], bar[1] + GRIP_IN_HAND], side: [-1, 0.2], hand: -90 },
          far: opts.single
            ? { target: (J) => add(J.Hf, [0, -12]), side: [-1, 0.2], hand: 80 }
            : { target: [bar[0] - 3, bar[1] + GRIP_IN_HAND], side: [-1, 0.2], hand: -90 },
        },
      };
    },
  };
}
