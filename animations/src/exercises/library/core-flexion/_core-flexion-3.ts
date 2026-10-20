// Shared side-view builders for the core-flexion-3 catalog items.
// Each builder keeps the stated supports fixed and moves the trunk, hips, or legs through the source range.
// The small wrappers supply the catalog name and source records for each visible variation.
import type { LibraryMeta, PropShape, SideExercise } from '@/exercise.ts';
import { add, dir, lerp, mul, smooth, sub, timeline, type Timeline, type Vec2 } from '@/math.ts';
import { solve, type Joints, type LimbPair, type LimbSpec, type Pose } from '@/rig.ts';
import type { Palette } from '@/palettes.ts';
import { A, ARM_STRAIGHT, FLOOR, G, GRIP_IN_HAND, hipForShoulder } from '@/exercises/common.ts';
import { BALL, ballShapes, barbell, baseRail, declineBench, dipBars, flatBench, foamRoller, heldPlate, medicineBall, pad, pullUpBar, rollerEnd, seatPad, smithRails, stabilityBall, tube, weightStack, workTL } from '@/exercises/equipment/index.ts';

type Catalog = { id: string; name: string; en: string; equipment: LibraryMeta['equipment']; sources: string[] };
type Load = 'none' | 'medicine' | 'plate';

const catalog = (x: Catalog): LibraryMeta => ({ en: x.en, family: 'core-flexion', equipment: x.equipment, sources: x.sources });
const fixedTL = workTL(0.4);

// -------- Floor crunches and sit-ups --------
const FLOOR_NECK: Vec2 = [142, FLOOR - 18];
const FLOOR_HIP: Vec2 = add(FLOOR_NECK, mul(dir(-3.8), 123.7));
const FLOOR_ANKLE: Vec2 = [FLOOR_HIP[0] + 106, FLOOR - A];
/** Spine angle from the hip to the neck when lying flat. FLOOR_HIP sits at dir(-3.8) from FLOOR_NECK, so the spine points the opposite way. */
const FLAT = 176.2;

const floorLegs = (ankle = FLOOR_ANKLE): LimbPair => ({
  near: { target: ankle, foot: 0, side: [0, -1] },
  far: { target: add(ankle, [-5, 0]), foot: 0, side: [0, -1] },
});

/** Both hands meet above the sternum. The ball or plate follows the near hand. */
const chestHold = (p: number): LimbPair => ({
  near: {
    target: (J) => add(add(J.B(0.6), mul(J.A(0.6), 34)), mul(J.T(0.6), -3 * p)),
    side: (J) => mul(J.T(0.6), -1), hand: -90,
  },
  far: {
    target: (J) => add(add(J.B(0.6), mul(J.A(0.6), 32)), add(mul(J.T(0.6), 10 - 3 * p), [-3, 0])),
    side: (J) => mul(J.T(0.6), -1), hand: -90,
  },
});

const armsOnFloor = (): LimbPair => ({
  near: { a1: 8, a2: 1, hand: 0 }, far: { a1: 7, a2: 0, hand: 0 },
});

export function floorCrunch(x: Catalog, load: Load = 'none', arms: 'floor' | 'head' = 'floor'): SideExercise {
  const tl = fixedTL;
  const dynamic = load === 'medicine'
    ? [medicineBall((J: Joints) => ({ p: add(J.wrist_n, mul(dir(J.hand_n.a), 8)) }))]
    : load === 'plate'
      ? [heldPlate((J: Joints) => ({ p: add(J.wrist_n, mul(dir(J.hand_n.a), 8)) }), 'edge', 'medium')]
      : undefined;
  return {
    id: x.id, name: x.name, tl, mat: true, meta: catalog(x),
    muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.35 }],
    dynamic,
    pose(t) {
      const p = tl.at(t).p;
      return {
        hip: FLOOR_HIP,
        spine: { lumbar: FLAT - 1, thoracic: FLAT + 31 * p },
        neck: lerp(182, 222, p), head: lerp(181, 225, p),
        legs: floorLegs(),
        arms: arms === 'head'
          ? { near: { a1: 178, a2: 178, hand: 178 }, far: { a1: 176, a2: 176, hand: 176 } }
          : load === 'none' ? armsOnFloor() : chestHold(p),
      };
    },
  } satisfies SideExercise;
}

/** Sit-up with the feet planted. The spine moves from the floor to a controlled 45-degree trunk angle. */
export function floorSitUp(x: Catalog, press = false, chestLoad = false): SideExercise {
  const tl = fixedTL;
  const plate = press || chestLoad ? heldPlate((J: Joints) => ({ p: add(J.wrist_n, mul(dir(J.hand_n.a), 8)) }), 'edge', 'medium') : undefined;
  return {
    id: x.id, name: x.name, tl, mat: true, meta: catalog(x),
    muscles: press
      ? [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.55 }, { m: 'triceps', side: 'both', scale: 0.45 }]
      : [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.45 }],
    dynamic: plate ? [plate] : undefined,
    pose(t) {
      // The Otis-up source stops short of returning all the way to the floor.
      const p = press ? 0.12 + 0.88 * tl.at(t).p : tl.at(t).p;
      const trunk = lerp(FLAT - 360, -130, p);
      const handsAtHead: LimbPair = {
        near: { target: (J) => add(add(J.N, mul(J.T(1), 38)), mul(J.A(1), -17)), side: [-1, 0], hand: 180 },
        far: { target: (J) => add(add(J.N, mul(J.T(1), 36)), mul(J.A(1), -20)), side: [-1, 0], hand: 180 },
      };
      return {
        hip: FLOOR_HIP,
        spine: { lumbar: trunk, thoracic: trunk - 2 },
        neck: lerp(-178, -128, p), head: lerp(-179, -128, p),
        legs: floorLegs(),
        arms: press ? {
          near: { target: (J) => {
            const low = add(add(J.B(0.6), mul(J.A(0.6), 44)), [0, 0]);
            const high = add(J.N, [-8, -84]);
            return [lerp(low[0], high[0], p), lerp(low[1], high[1], p)];
          }, side: [-1, 0], hand: -90 },
          far: { target: (J) => {
            const low = add(add(J.B(0.6), mul(J.A(0.6), 42)), [-3, 0]);
            const high = add(J.N, [-11, -82]);
            return [lerp(low[0], high[0], p), lerp(low[1], high[1], p)];
          }, side: [-1, 0], hand: -90 },
        } : chestLoad ? chestHold(p) : handsAtHead,
      };
    },
  } satisfies SideExercise;
}

/** Decline sit-up: ankles remain secured at the high end while the trunk curls from the pad to near vertical. */
export function weightedDeclineSitUp(x: Catalog): SideExercise {
  const tl = fixedTL;
  const bench = declineBench({ x: 94, angle: 20, low: 70, length: 230 });
  const hip: Vec2 = [210, 342], ankle: Vec2 = [bench.roller[0] - 17, bench.roller[1] + 11];
  return {
    id: x.id, name: x.name, tl, meta: catalog(x),
    muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.45 }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [heldPlate((J: Joints) => ({ p: add(J.wrist_n, mul(dir(J.hand_n.a), 8)) }), 'edge', 'medium')],
    pose(t) {
      const p = tl.at(t).p;
      // The decline pad runs down toward the head at 160 degrees; the trunk rises through 215 to vertical.
      const trunk = lerp(160, 270, p);
      return {
        hip, spine: { lumbar: trunk, thoracic: trunk - 2 }, neck: trunk - 2, head: trunk - 2,
        legs: { near: { target: ankle, foot: -20, side: [0, -1] }, far: { target: add(ankle, [-4, 0]), foot: -20, side: [0, -1] } },
        arms: chestHold(p),
      };
    },
  } satisfies SideExercise;
}

/** Foam roller remains squeezed between the feet while the hips and knees curl toward the ribs. */
export function foamReverseCrunch(x: Catalog): SideExercise {
  const tl = fixedTL;
  return {
    id: x.id, name: x.name, tl, mat: true, meta: catalog(x),
    muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }],
    dynamic: [foamRoller((J: Joints) => ({ p: add(J.ankle_n, [-2, -3]) }), 'end', 'front')],
    pose(t) {
      const p = tl.at(t).p;
      return {
        hip: FLOOR_HIP,
        spine: { lumbar: FLAT - 1, thoracic: FLAT - 1 + 12 * p }, neck: 182, head: 181,
        legs: {
          near: { a1: lerp(0, -68, p), a2: lerp(0, 12, p), foot: lerp(0, -20, p) },
          far: { a1: lerp(1, -66, p), a2: lerp(1, 14, p), foot: lerp(1, -18, p) },
        },
        arms: { near: { a1: 180, a2: 180, hand: 180 }, far: { a1: 178, a2: 178, hand: 178 } },
      };
    },
  } satisfies SideExercise;
}

// -------- Hanging raises --------
// The hand and shoulder heights leave a visible gap below the soles in the passive hang.
const HANG_SHOULDER: Vec2 = [254, 142];
const HANG_SPINE = { lumbar: -90, thoracic: -90 };
const HANG_WRIST: Vec2 = [254, 16];
const HANG_BAR = HANG_WRIST[1] - GRIP_IN_HAND;

const hangUpper = (spine = HANG_SPINE): Omit<Pose, 'legs'> => ({
  hip: hipForShoulder(HANG_SHOULDER, spine), spine, neck: -90, head: -90,
  farHip: 0,
  arms: {
    near: { target: HANG_WRIST, side: [-1, 0], hand: -90 },
    far: { target: (J) => add(HANG_WRIST, sub(J.Sf, J.S)), side: [-1, 0], hand: -90 },
  },
});

function hangLegs(kind: 'straight' | 'hip-straight' | 'knee' | 'high-knee' | 'pike', p: number): LimbPair {
  if (kind === 'straight' || kind === 'hip-straight') {
    const top = kind === 'hip-straight' ? -12 : 0;
    return {
      near: { a1: lerp(90, top, p), a2: lerp(90, top, p), foot: lerp(0, -85, p) },
      far: { a1: lerp(91, top + 1, p), a2: lerp(91, top + 1, p), foot: lerp(1, -84, p) },
    };
  }
  if (kind === 'pike') return {
    near: { a1: lerp(0, -80, p), a2: lerp(90, -80, p), foot: lerp(0, -80, p) },
    far: { a1: lerp(1, -79, p), a2: lerp(91, -79, p), foot: lerp(1, -79, p) },
  };
  const high = kind === 'high-knee';
  return {
    near: { a1: lerp(90, high ? -38 : -18, p), a2: lerp(90, high ? 128 : 112, p), foot: lerp(0, 45, p) },
    far: { a1: lerp(91, high ? -37 : -17, p), a2: lerp(91, high ? 129 : 113, p), foot: lerp(1, 46, p) },
  };
}

export function hangingRaise(x: Catalog, kind: 'straight' | 'hip-straight' | 'knee' | 'high-knee' | 'pike', weighted = false, straps = false): SideExercise {
  const tl = fixedTL;
  const station = pullUpBar({ view: 'side', x: HANG_WRIST[0], y: HANG_BAR });
  return {
    id: x.id, name: x.name, tl, meta: catalog(x),
    muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }, { m: 'forearms', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: station.draw(pal) }), propsBox: station.box,
    dynamic: [
      ...(straps ? [
        { nm: 'Near ab strap', kind: 'line' as const, z: 'front' as const, width: 7, color: (pal: Palette) => pal.pad, at: (J: Joints): [Vec2, Vec2] => [[HANG_WRIST[0], HANG_BAR], J.elbow_n] },
        { nm: 'Far ab strap', kind: 'line' as const, z: 'back' as const, width: 7, color: (pal: Palette) => pal.padFar, at: (J: Joints): [Vec2, Vec2] => [[HANG_WRIST[0] - 4, HANG_BAR], J.elbow_f] },
      ] : []),
      ...(weighted ? [
        { nm: 'Near ankle weight', kind: 'rigid' as const, z: 'front' as const, shapes: (pal: Palette): PropShape[] => [
          { kind: 'box', nm: 'ankle cuff', color: pal.padFar, c: [0, 0], s: [22, 14], r: 5 },
        ], at: (J: Joints) => ({ p: J.ankle_n, a: J.shin_n.a }) },
        { nm: 'Far ankle weight', kind: 'rigid' as const, z: 'back' as const, shapes: (pal: Palette): PropShape[] => [
          { kind: 'box', nm: 'ankle cuff', color: pal.padFar, c: [0, 0], s: [22, 14], r: 5 },
        ], at: (J: Joints) => ({ p: J.ankle_f, a: J.shin_f.a }) },
      ] : []),
    ],
    pose: (t) => ({
      ...hangUpper(), legs: hangLegs(kind, tl.at(t).p),
      ...(straps ? { arms: { near: { a1: 90, a2: 90, hand: 90 }, far: { a1: 91, a2: 91, hand: 91 } } } : {}),
    }),
  } satisfies SideExercise;
}

/** Alternating knee drive. Both legs return to the fully extended hang at the loop seam. */
export function alternatingHang(x: Catalog): SideExercise {
  const effort = (t: number) => 0.25 + 0.75 * Math.abs(Math.sin(Math.PI * 2 * t));
  const leg = (p: number, far = false): LimbSpec => ({
    a1: lerp(90 + (far ? 1 : 0), -34 + (far ? 1 : 0), p),
    a2: lerp(90 + (far ? 1 : 0), 125 + (far ? 1 : 0), p), foot: lerp(far ? 1 : 0, 42, p),
  });
  const station = pullUpBar({ view: 'side', x: HANG_WRIST[0], y: HANG_BAR });
  return {
    id: x.id, name: x.name, tl: { total: 3.2 }, meta: catalog(x),
    muscles: [{ m: 'abs', e: effort }, { m: 'hipFlexor', side: 'both', scale: 0.55, e: effort }, { m: 'forearms', side: 'both', scale: 0.3, e: () => 0.3 }],
    props: (pal) => ({ back: station.draw(pal) }), propsBox: station.box,
    pose(t) {
      const s = Math.sin(Math.PI * 2 * t);
      return { ...hangUpper(), legs: { near: leg(Math.max(0, s)), far: leg(Math.max(0, -s), true) } };
    },
  } satisfies SideExercise;
}

/** Straight-arm support above parallel bars; the legs lift forward while the elbows remain locked. */
export function parallelBarLegRaise(x: Catalog): SideExercise {
  const tl = fixedTL;
  const S: Vec2 = [254, 142], wrist: Vec2 = [254, 268];
  const spine = { lumbar: -90, thoracic: -90 };
  const bars = dipBars({ view: 'side', x: wrist[0], y: wrist[1] + GRIP_IN_HAND });
  return {
    id: x.id, name: x.name, tl, meta: catalog(x),
    muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.55 }, { m: 'triceps', side: 'both', scale: 0.3 }],
    props: (pal) => ({ back: bars.draw(pal) }), propsBox: bars.box,
    pose(t) {
      const p = tl.at(t).p;
      return {
        hip: hipForShoulder(S, spine), spine, neck: -90, head: -90, farHip: 0,
        legs: hangLegs('straight', p),
        arms: {
          near: { target: wrist, side: [-1, 0], hand: 90 },
          far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: 90 },
        },
      };
    },
  } satisfies SideExercise;
}

// -------- Ball-supported core work --------
const BALL_CENTER: Vec2 = [246, G - BALL.r];
const BALL_HIP: Vec2 = [246, 360];
const BALL_ANKLE: Vec2 = [347, FLOOR - A];

const ballArms = (): LimbPair => ({
  near: { target: (J) => add(J.B(0.58), mul(J.A(0.58), 35)), side: [0, -1], hand: -90 },
  far: { target: (J) => add(add(J.B(0.58), mul(J.A(0.58), 33)), [-3, 0]), side: [0, -1], hand: -90 },
});

export function stabilityBallCrunch(x: Catalog, kind: 'crossed' | 'head' | 'straight' | 'overhead' = 'crossed'): SideExercise {
  const tl = fixedTL;
  const withPlate = kind === 'overhead';
  return {
    id: x.id, name: x.name, tl, meta: catalog(x),
    muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.35 }, ...(withPlate ? [{ m: 'delts' as const, side: 'both' as const, scale: 0.3 }] : [])],
    props: (pal) => ({ back: ballShapes(pal).map((q) => q.kind === 'poly' ? q : { ...q, c: add(q.c, BALL_CENTER) }) }),
    propsBox: [BALL_CENTER[0] - BALL.r, BALL_CENTER[0] + BALL.r],
    dynamic: withPlate ? [heldPlate((J: Joints) => ({ p: add(J.wrist_n, mul(dir(J.hand_n.a), 8)) }), 'edge', 'medium')] : undefined,
    pose(t) {
      const p = tl.at(t).p;
      const trunk = lerp(-160, -122, p);
      const arms: LimbPair = kind === 'head'
        ? {
          near: { target: (J) => add(add(J.N, mul(J.T(1), 38)), mul(J.A(1), -17)), side: [-1, 0], hand: 180 },
          far: { target: (J) => add(add(J.N, mul(J.T(1), 36)), mul(J.A(1), -20)), side: [-1, 0], hand: 180 },
        }
        : kind === 'straight'
          ? {
            near: { a1: 30, a2: 30, hand: 30 },
            far: { a1: 31, a2: 31, hand: 31 },
          }
          : kind === 'overhead'
          ? {
            near: { target: (J) => add(J.N, [-3, -90]), side: [-1, 0], hand: -90 },
            far: { target: (J) => add(J.N, [-7, -88]), side: [-1, 0], hand: -90 },
          }
          : ballArms();
      return {
        hip: BALL_HIP, spine: { lumbar: trunk, thoracic: trunk - 2 }, neck: trunk - 3, head: trunk - 2,
        legs: { near: { target: BALL_ANKLE, foot: 0, side: [0, -1] }, far: { target: add(BALL_ANKLE, [-5, 0]), foot: 0, side: [0, -1] } }, arms,
      };
    },
  } satisfies SideExercise;
}

/** Floor crunch with calves on the ball. The ball stays still and the lower back stays on the mat. */
export function ballLegsCrunch(x: Catalog): SideExercise {
  const tl = fixedTL;
  const c: Vec2 = [365, 365], ankle: Vec2 = [365, 302];
  return {
    id: x.id, name: x.name, tl, mat: true, meta: catalog(x), muscles: [{ m: 'abs' }],
    props: (pal) => ({ back: ballShapes(pal).map((q) => q.kind === 'poly' ? q : { ...q, c: add(q.c, c) }) }), propsBox: [c[0] - BALL.r, c[0] + BALL.r],
    pose(t) {
      const p = tl.at(t).p;
      return {
        hip: FLOOR_HIP, spine: { lumbar: FLAT - 1, thoracic: FLAT + 31 * p }, neck: lerp(182, 222, p), head: lerp(181, 225, p),
        legs: { near: { target: ankle, foot: -18, side: [0, -1] }, far: { target: add(ankle, [-5, 0]), foot: -18, side: [0, -1] } },
        arms: { near: { a1: 178, a2: 178, hand: 178 }, far: { a1: 176, a2: 176, hand: 176 } },
      };
    },
  } satisfies SideExercise;
}

/** The shins ride the ball while the planted hands and torso remain in a straight high plank. */
export function ballKneeTuck(x: Catalog): SideExercise {
  const tl = fixedTL;
  // At the start, the shins cross the top of the ball and the hip, shoulders and heels form one line.
  const hip: Vec2 = [298.5, 319.7], spine = { lumbar: -4.2, thoracic: -5.2 };
  const wrist: Vec2 = [397, FLOOR - 7];
  const ballAt = (p: number): Vec2 => [lerp(118, 245, p), G - BALL.r];
  // The ball rolls toward the hands while each ankle follows its visible upper-right surface.
  const leg = (p: number, far = false): LimbSpec => ({
    target: add(ballAt(p), mul(dir(lerp(-90, -40, p)), BALL.r + (far ? 1 : 0))),
    foot: lerp(85, 45, p), side: [0, 1],
  });
  return {
    id: x.id, name: x.name, tl, mat: true, meta: catalog(x),
    muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.35 }],
    dynamic: [stabilityBall((_J, t) => ({ p: ballAt(tl.at(t).p) }), 'back')],
    propsBox: [50, 313],
    pose(t) {
      const p = tl.at(t).p;
      return {
        hip, farHip: 0, farShoulder: 0, spine, neck: -8.2, head: -2.2,
        legs: { near: leg(p), far: leg(p, true) },
        arms: { near: { target: wrist, side: [-1, 0], hand: 0 }, far: { target: add(wrist, [-3, 0]), side: [-1, 0], hand: 0 } },
      };
    },
  } satisfies SideExercise;
}

/** Seated on the ball, hands brace its sides as the knees draw in and the hips roll forward. */
export function seatedBallTuck(x: Catalog): SideExercise {
  const tl = fixedTL;
  const hip0: Vec2 = [230, 315], ankle: Vec2 = [334, FLOOR - A];
  return {
    id: x.id, name: x.name, tl, meta: catalog(x), muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.55 }],
    props: (pal) => ({ back: ballShapes(pal).map((q) => q.kind === 'poly' ? q : { ...q, c: add(q.c, [230, G - BALL.r]) }) }), propsBox: [162, 298],
    pose(t) {
      const p = tl.at(t).p;
      const hip: Vec2 = [lerp(hip0[0], 248, p), lerp(hip0[1], 322, p)];
      return {
        hip, spine: { lumbar: lerp(-92, -62, p), thoracic: lerp(-94, -65, p) }, neck: -90, head: -88,
        legs: {
          near: { target: ankle, foot: 0, side: [0, -1] }, far: { target: add(ankle, [-5, 0]), foot: 0, side: [0, -1] },
        },
        arms: {
          near: { target: (J) => add(J.S, [22, 112]), side: [1, 0], hand: 90 },
          far: { target: (J) => add(J.Sf, [18, 108]), side: [1, 0], hand: 90 },
        },
      };
    },
  } satisfies SideExercise;
}

// -------- Machines and suspended support --------
const MACHINE_HIP: Vec2 = [216, G - 112];
const MACHINE_ANKLE: Vec2 = [319, G - A];
const machineTL = workTL(0.4);
const machineLegs = (lift: number): LimbPair => ({
  near: { target: [MACHINE_ANKLE[0], MACHINE_ANKLE[1] - lift], foot: 0, side: [0, -1] },
  far: { target: [MACHINE_ANKLE[0] - 5, MACHINE_ANKLE[1] - lift], foot: 0, side: [0, -1] },
});

/** A lever crunch machine: fixed seat and feet, moving upper-body pad, and lifted selector stack. */
export function machineCrunch(x: Catalog, mode: 'ab' | 'chest-pad' | 'seated' | 'leg-raise'): SideExercise {
  const tl = machineTL;
  const stack = weightStack({ x: 102, top: 118, lift: (t) => 28 * tl.at(t).p });
  const start = mode === 'chest-pad' ? -128 : mode === 'seated' ? -136 : -112;
  const end = mode === 'chest-pad' ? -92 : -62;
  const probe = solve({ hip: MACHINE_HIP, spine: { lumbar: start, thoracic: start - 2 }, neck: start, head: start, legs: machineLegs(0), arms: { near: { a1: 0, a2: 0 }, far: { a1: 0, a2: 0 } } });
  const backC: Vec2 = [MACHINE_HIP[0] - 45, MACHINE_HIP[1] - 28];
  const chestPad = (J: Joints) => add(J.B(0.7), mul(J.A(0.7), 27));
  return {
    id: x.id, name: x.name, tl, meta: catalog(x),
    muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.35 }, ...(mode === 'leg-raise' ? [{ m: 'hipFlexor' as const, side: 'both' as const, scale: 0.55 }] : [])],
    props: (pal) => ({ back: [
      ...stack.fixed(pal), baseRail(pal, 65, 375), tube(pal, 'upright', [145, G - 8], [145, 144], { w: 15 }),
      tube(pal, 'top rail', [145, 144], [274, 144], { w: 14 }), tube(pal, 'seat post', [225, G - 8], [225, MACHINE_HIP[1] + 22], { dark: true, w: 14 }),
      tube(pal, 'foot post', [333, G - 8], [333, MACHINE_ANKLE[1] - 22], { dark: true, w: 13 }),
      pad(pal, 'backrest', backC, [20, 148], -8), seatPad(pal, 236, MACHINE_HIP[1] + 22, 102),
      ...rollerEnd(pal, 'foot hold', [334, MACHINE_ANKLE[1] - 8], 30),
      { kind: 'box', nm: 'handle', color: pal.padFar, c: [274, MACHINE_HIP[1] - 7], s: [34, 10], r: 5 },
    ] }),
    propsBox: [stack.box[0], 382],
    dynamic: [stack.dynamic, {
      nm: 'Crunch lever', kind: 'rigid', z: 'overFarArm',
      shapes: (pal) => [
        { kind: 'box', nm: 'lever', color: pal.metal, c: [0, 36], s: [12, 82], r: 6 },
        { kind: 'box', nm: 'chest pad', color: pal.pad, c: [0, 78], s: [23, 52], r: 9 },
      ],
      at: (J: Joints) => ({ p: chestPad(J), a: J.T(0.7)[1] < 0 ? -90 : 90 }),
    }],
    pose(t) {
      const p = tl.at(t).p;
      const trunk = lerp(start, end, p);
      const lift = mode === 'ab' || mode === 'leg-raise' ? 42 * p : 0;
      return {
        hip: MACHINE_HIP, spine: { lumbar: trunk, thoracic: trunk - 2 }, neck: trunk - 3, head: trunk - 2,
        legs: machineLegs(lift),
        arms: {
          near: { target: (J) => add(J.B(0.55), mul(J.A(0.55), 31)), side: [0, -1], hand: -90 },
          far: { target: (J) => add(add(J.B(0.55), mul(J.A(0.55), 29)), [-3, 0]), side: [0, -1], hand: -90 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Feet in suspension handles; arms stay planted while knees and hips curl under the torso. */
export function suspensionReverseCrunch(x: Catalog): SideExercise {
  const tl = fixedTL;
  // The long start matches a high plank: shoulders are over the palms with almost straight elbows.
  const hip: Vec2 = [298.5, 319.7], spine = { lumbar: -4.2, thoracic: -5.2 }, wrist: Vec2 = [397, FLOOR - 7];
  const bar = pullUpBar({ view: 'side', x: 118, y: 56 });
  const leg = (p: number, far = false): LimbSpec => ({
    a1: lerp(161, 20, p) + (far ? 1 : 0), a2: lerp(161, 160, p) + (far ? 1 : 0), foot: lerp(85, 35, p),
  });
  return {
    id: x.id, name: x.name, tl, mat: true, meta: catalog(x), muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.5 }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: bar.draw(pal) }), propsBox: bar.box,
    dynamic: [
      { nm: 'Near suspension strap', kind: 'line', z: 'back', width: 4, color: (pal) => pal.cable, at: (J: Joints) => [[118, 56], J.ankle_n] },
      { nm: 'Far suspension strap', kind: 'line', z: 'back', width: 4, color: (pal) => pal.cable, at: (J: Joints) => [[113, 56], J.ankle_f] },
    ],
    pose(t) {
      const p = tl.at(t).p;
      return { hip, farHip: 0, farShoulder: 0, spine, neck: -8.2, head: -2.2, legs: { near: leg(p), far: leg(p, true) }, arms: { near: { target: wrist, side: [-1, 0], hand: 0 }, far: { target: add(wrist, [-3, 0]), side: [-1, 0], hand: 0 } } };
    },
  } satisfies SideExercise;
}

/** Bench-supported posterior pelvic curl with the soles braced against a fixed Smith bar. */
export function smithHipRaise(x: Catalog): SideExercise {
  const tl = fixedTL;
  const bench = flatBench({ view: 'side', x: 255, top: 86, length: 220 });
  const N: Vec2 = [158, 350], hip0: Vec2 = [272, 353], ankle: Vec2 = [397, 341];
  const rails = smithRails({ view: 'side', x: 415, top: 55 });
  return {
    id: x.id, name: x.name, tl, meta: catalog(x), muscles: [{ m: 'abs' }, { m: 'hipFlexor', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: [...bench.draw(pal), ...rails.draw(pal)] }), propsBox: [bench.box[0], rails.box[1]],
    dynamic: [barbell({ view: 'side', plate: 'medium', at: () => ({ p: [415, 342] }), z: 'front' })],
    pose(t) {
      const p = tl.at(t).p;
      const hip: Vec2 = [hip0[0], hip0[1] - 32 * p];
      return {
        hip, spine: { target: N, side: [0, 1] }, neck: 182, head: 181,
        legs: { near: { target: ankle, foot: 0, side: [0, -1] }, far: { target: add(ankle, [-4, 0]), foot: 0, side: [0, -1] } },
        arms: { near: { a1: 178, a2: 178, hand: 178 }, far: { a1: 176, a2: 176, hand: 176 } },
      };
    },
  } satisfies SideExercise;
}
