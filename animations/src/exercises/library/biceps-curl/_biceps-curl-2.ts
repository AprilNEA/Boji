// Shared biceps-curl-2 builders. Each curl keeps the upper arm fixed while the elbow closes from about 175° to 36°.
// Cable attachments stay connected to their low or high pulley. Benches, pads and the ball support the stated start pose.
import type { FrontExercise, MovingPart, SideExercise } from '@/exercise.ts';
import { add, ang, dir, lerp, mul, sub, type Vec2 } from '@/math.ts';
import { type Vec3 } from '@/math3.ts';
import type { FrontJoints } from '@/front-rig.ts';
import type { Joints, LimbPair, LimbSpec, Pose } from '@/rig.ts';
import { A, FLOOR, G, handOnHip, standLegs } from '@/exercises/common.ts';
import {
  BALL, barbell, cableColumn, cableHandle, cableLine, dumbbell, flatBench, frontGripAt, gripAt, inclineBench, preacherBench,
  stabilityBall, towardCable, workTL,
} from '@/exercises/equipment/index.ts';

type HandleKind = 'd' | 'rope' | 'end';
type Data = { id: string; name: string; en: string; sources: string[] };

const X = 244;
const HANG = 86;
const TOP = -49;
const STAND_HIP_Y = G - A - 183.8;

const upper = (p: number, a1 = 91, offset = 0): LimbSpec => {
  const fore = lerp(HANG, TOP, p) + offset;
  return { a1, a2: fore, hand: fore };
};

function cableParts(pulley: Vec2, kind: HandleKind): MovingPart<Joints>[] {
  const grip = (J: Joints): Vec2 => gripAt(J, 'n');
  return [
    cableLine<Joints>(pulley, (J) => grip(J)),
    cableHandle<Joints>(kind, (J) => {
      const p = grip(J);
      return { p, a: towardCable(p, pulley) };
    }),
  ];
}

function cableStation(x: number, pulleyY: number, kind: HandleKind) {
  const column = cableColumn({ x, pulleyY, toward: -1 });
  return { column, dynamic: cableParts(column.pulley, kind) };
}

const curlMuscles = (unilateral = false) => [
  { m: 'biceps' as const, side: unilateral ? 'near' as const : 'both' as const },
  { m: 'forearms' as const, side: unilateral ? 'near' as const : 'both' as const, scale: 0.45 },
];

/** Standing cable curl. The low pulley stays in front of the lifter and the elbows remain next to the ribs. */
export function standingCableCurl(data: Data, opts: { unilateral?: boolean; reverse?: boolean; rope?: boolean } = {}): SideExercise {
  const tl = workTL(0.35);
  const unilateral = opts.unilateral ?? false;
  const station = cableStation(382, G - 23, opts.rope ? 'rope' : unilateral ? 'd' : 'end');
  return {
    id: data.id, name: data.name, tl,
    meta: { en: data.en, family: 'biceps-curl', equipment: ['cable'], sources: data.sources },
    muscles: curlMuscles(unilateral),
    props: (pal) => ({ back: station.column.draw(pal) }),
    propsBox: [X - 46, station.column.box[1]],
    dynamic: station.dynamic,
    pose(t): Pose {
      const p = tl.at(t).p;
      const handOffset = opts.reverse ? 180 : 0;
      return {
        hip: [X, STAND_HIP_Y], spine: { lumbar: -89, thoracic: -91 }, neck: -87, head: -89,
        legs: standLegs(X),
        arms: unilateral
          ? { near: { ...upper(p), hand: lerp(HANG, TOP, p) + handOffset }, far: handOnHip(-5) }
          : {
              near: { ...upper(p), hand: lerp(HANG, TOP, p) + handOffset },
              far: { ...upper(p, 93, 2), hand: lerp(HANG, TOP, p) + 2 + handOffset },
            },
      };
    },
  } satisfies SideExercise;
}

/** Standing free-weight curl. The bar is held centrally in the near hand for the side-view representation. */
export function standingBarbellCurl(data: Data): SideExercise {
  const tl = workTL(0.35);
  return {
    id: data.id, name: data.name, tl,
    meta: { en: data.en, family: 'biceps-curl', equipment: ['barbell'], sources: data.sources },
    muscles: curlMuscles(),
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose(t): Pose {
      const p = tl.at(t).p;
      return {
        hip: [X, STAND_HIP_Y], spine: { lumbar: -89, thoracic: -91 }, neck: -87, head: -89,
        legs: standLegs(X), arms: { near: upper(p), far: upper(p, 93, 2) },
      };
    },
  } satisfies SideExercise;
}

/** Front-view wide-grip curl. The broad, fixed hand spacing stays readable while both elbows flex without torso sway. */
export function wideGripBarbellCurl(data: Data): FrontExercise {
  const tl = workTL(0.35);
  const arm = (side: 'l' | 'r', p: number) => {
    const sign = side === 'l' ? 1 : -1;
    return {
      // The hands remain 140 px apart, wider than the 66 px shoulder distance, throughout the curl.
      target: (J: FrontJoints): Vec3 => [J[`shoulder_${side}`][0] + sign * 37, J[`shoulder_${side}`][1] + lerp(-120, -30, p), 12],
      pole: [sign * 0.45, 0, -1] as Vec3,
      dir: [0, 0, 1] as Vec3,
    };
  };
  return {
    id: data.id, name: data.name, view: 'front', tl,
    meta: { en: data.en, family: 'biceps-curl', equipment: ['barbell'], sources: data.sources },
    muscles: curlMuscles(),
    dynamic: [barbell<FrontJoints>({
      view: 'front', plate: 'medium',
      at: (J) => {
        const l = frontGripAt(J, 'l'), r = frontGripAt(J, 'r');
        return { p: [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2] };
      },
    })],
    pose(t) {
      const p = tl.at(t).p;
      return {
        pelvis: [0, A + 183.8, 0],
        hips: { pitch: 1 }, spine: { pitch: -1 }, head: { pitch: -2 },
        legs: { l: { target: [28, A, 2] }, r: { target: [-28, A, 2] } },
        arms: { l: arm('l', p), r: arm('r', p) },
      };
    },
  } satisfies FrontExercise;
}

/** A forward-leaning single-arm barbell curl. The far hand rests on the thigh for balance. */
export function standingConcentrationBarbell(data: Data): SideExercise {
  const tl = workTL(0.4);
  return {
    id: data.id, name: data.name, tl,
    meta: { en: data.en, family: 'biceps-curl', equipment: ['barbell'], sources: data.sources },
    muscles: curlMuscles(true),
    dynamic: [barbell({ view: 'side', plate: 'small', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose(t): Pose {
      const p = tl.at(t).p;
      const fore = lerp(82, -62, p);
      return {
        hip: [X - 18, G - A - 180], spine: { lumbar: -66, thoracic: -68 }, neck: -67, head: -66,
        legs: standLegs(X),
        arms: {
          near: { a1: 82, a2: fore, hand: fore },
          far: { a1: 84, a2: 92, hand: 92 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Upright seated cable curl. The hips stay on the bench and the feet remain flat while both elbows stay at the sides. */
export function seatedCableCurl(data: Data): SideExercise {
  const tl = workTL(0.35);
  const bench = flatBench({ view: 'side', x: 254, top: 96, length: 150 });
  const station = cableStation(392, G - 23, 'end');
  const hip: Vec2 = [222, G - 104];
  const legs: LimbPair = {
    near: { target: [322, G - A], foot: 0, side: [0, -1] },
    far: { target: [316, G - A], foot: 0, side: [0, -1] },
  };
  return {
    id: data.id, name: data.name, tl,
    meta: { en: data.en, family: 'biceps-curl', equipment: ['cable', 'bench'], sources: data.sources },
    muscles: curlMuscles(),
    props: (pal) => ({ back: [...bench.draw(pal), ...station.column.draw(pal)] }),
    propsBox: [bench.box[0], station.column.box[1]], dynamic: station.dynamic,
    pose(t): Pose {
      const p = tl.at(t).p;
      return {
        hip, spine: { lumbar: -96, thoracic: -98 }, neck: -92, head: -90, legs,
        arms: { near: upper(p), far: upper(p, 93, 2) },
      };
    },
  } satisfies SideExercise;
}

/** Seated concentration curl. The torso inclines over the thigh and the near elbow stays immediately above its inner side. */
export function concentrationCableCurl(data: Data, useDumbbell = false): SideExercise {
  const tl = workTL(0.4);
  const bench = flatBench({ view: 'side', x: 246, top: 96, length: 165 });
  const station = cableStation(390, G - 23, 'd');
  const hip: Vec2 = [218, G - 104];
  const legs: LimbPair = {
    near: { target: [323, G - A], foot: 0, side: [0, -1] },
    far: { target: [317, G - A], foot: 0, side: [0, -1] },
  };
  return {
    id: data.id, name: data.name, tl,
    meta: {
      en: data.en, family: 'biceps-curl', equipment: useDumbbell ? ['dumbbell', 'bench'] : ['cable', 'bench'], sources: data.sources,
    },
    muscles: curlMuscles(true),
    props: useDumbbell ? (pal) => ({ back: bench.draw(pal) }) : (pal) => ({ back: [...bench.draw(pal), ...station.column.draw(pal)] }),
    propsBox: useDumbbell ? bench.box : [bench.box[0], station.column.box[1]],
    dynamic: useDumbbell ? [dumbbell('n', 'end')] : station.dynamic,
    pose(t): Pose {
      const p = tl.at(t).p;
      const fore = lerp(82, -62, p);
      return {
        hip, spine: { lumbar: -48, thoracic: -50 }, neck: -51, head: -49, legs,
        arms: {
          near: { a1: 82, a2: fore, hand: fore },
          far: { a1: 86, a2: 92, hand: 92 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Supine cable curl. It uses either a bench with flat feet or a mat with feet braced into the pulley frame. */
export function lyingCableCurl(data: Data, onMat = false): SideExercise {
  const tl = workTL(0.4);
  const bench = flatBench({ view: 'side', x: 278, top: 90, length: 300 });
  const station = cableStation(onMat ? 480 : 454, G - 23, 'end');
  const neck: Vec2 = [170, (onMat ? FLOOR : bench.seatY) - 18];
  const hip = add(neck, mul(dir(-3.8), 123.7));
  const flat = ang(sub(neck, hip));
  const legs: LimbPair = onMat
    ? {
        // The source uses straight legs against the frame. The minimal bend here preserves a flat floor contact.
        near: { target: [475, G - A], foot: 0, side: [0, -1] },
        far: { target: [469, G - A], foot: 0, side: [0, -1] },
      }
    : {
        near: { target: [422, G - A], foot: 0, side: [0, -1] },
        far: { target: [416, G - A], foot: 0, side: [0, -1] },
  };
  return {
    id: data.id, name: data.name, tl, ...(onMat ? { mat: true } : {}),
    meta: { en: data.en, family: 'biceps-curl', equipment: onMat ? ['cable', 'mat'] : ['cable', 'bench'], sources: data.sources },
    muscles: curlMuscles(),
    props: (pal) => ({ back: onMat ? station.column.draw(pal) : [...bench.draw(pal), ...station.column.draw(pal)] }),
    propsBox: onMat ? [120, station.column.box[1]] : [bench.box[0], station.column.box[1]], dynamic: station.dynamic,
    pose(t): Pose {
      const p = tl.at(t).p;
      const fore = lerp(2, -142, p);
      return {
        hip, spine: { lumbar: flat - 1, thoracic: flat + 1 }, neck: 182, head: 181, legs,
        arms: {
          near: { a1: 1, a2: fore, hand: fore },
          far: { a1: 0, a2: fore - 1, hand: fore - 1 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Incline-bench cable curl. The torso stays against the pad while the arms hang and curl without shoulder travel. */
export function inclineCableCurl(data: Data): SideExercise {
  const tl = workTL(0.4);
  const bench = inclineBench({ x: 288, angle: 55, top: 90, facing: 1 });
  const station = cableStation(438, G - 23, 'end');
  const hip: Vec2 = [291, 346];
  const legs: LimbPair = {
    near: { target: [394, G - A], foot: 0, side: [0, -1] },
    far: { target: [388, G - A], foot: 0, side: [0, -1] },
  };
  return {
    id: data.id, name: data.name, tl,
    meta: { en: data.en, family: 'biceps-curl', equipment: ['cable', 'bench'], sources: data.sources },
    muscles: curlMuscles(),
    props: (pal) => ({ back: [...bench.draw(pal), ...station.column.draw(pal)] }),
    propsBox: [bench.box[0], station.column.box[1]], dynamic: station.dynamic,
    pose(t): Pose {
      const p = tl.at(t).p;
      const fore = lerp(87, -52, p);
      return {
        hip, spine: { lumbar: -124, thoracic: -126 }, neck: -124, head: -122, legs,
        arms: {
          near: { a1: 91, a2: fore, hand: fore },
          far: { a1: 93, a2: fore + 2, hand: fore + 2 },
        },
      };
    },
  } satisfies SideExercise;
}

/** Preacher cable curl. The upper arm follows the sloped pad and only the forearm moves toward the shoulder. */
export function preacherCableCurl(data: Data, opts: { seated?: boolean; unilateral?: boolean; reverse?: boolean; rope?: boolean } = {}): SideExercise {
  const tl = workTL(0.4);
  const seated = opts.seated ?? false;
  const unilateral = opts.unilateral ?? false;
  // The pad top meets the shoulder. Its 45° face supports the complete upper arm to the elbow.
  const bench = preacherBench({ x: seated ? 204 : 214, y: seated ? 249 : 154, seatX: seated ? 224 : 230, facing: 1 });
  const station = cableStation(402, G - 23, opts.rope ? 'rope' : unilateral ? 'd' : 'end');
  const hip: Vec2 = seated ? [221, G - 104] : [218, STAND_HIP_Y];
  const legs: LimbPair = seated
    ? { near: { target: [321, G - A], foot: 0, side: [0, -1] }, far: { target: [315, G - A], foot: 0, side: [0, -1] } }
    : standLegs(218);
  return {
    id: data.id, name: data.name, tl,
    meta: { en: data.en, family: 'biceps-curl', equipment: ['cable', 'bench'], sources: data.sources },
    muscles: curlMuscles(unilateral),
    props: (pal) => ({ back: [...bench.draw(pal), ...station.column.draw(pal)] }),
    propsBox: [bench.box[0], station.column.box[1]], dynamic: station.dynamic,
    pose(t): Pose {
      const p = tl.at(t).p;
      // The upper arm follows the pad face. The elbow opens to 165° and closes to 45°.
      const a1 = 45;
      const fore = lerp(30, -90, p);
      const handOffset = opts.reverse ? 180 : 0;
      return {
        hip, spine: seated ? { lumbar: -96, thoracic: -98 } : { lumbar: -89, thoracic: -91 },
        neck: seated ? -92 : -87, head: seated ? -90 : -89, legs,
        arms: unilateral
          ? { near: { a1, a2: fore, hand: fore + handOffset }, far: handOnHip(-4) }
          : {
              near: { a1, a2: fore, hand: fore + handOffset },
              far: { a1: a1 + 2, a2: fore + 2, hand: fore + 2 + handOffset },
            },
      };
    },
  } satisfies SideExercise;
}

/** Standing overhead curl. Upper arms point upward beside the ears while the hands curl down toward the forehead. */
export function overheadCableCurl(data: Data): SideExercise {
  const tl = workTL(0.4);
  const station = cableStation(390, 54, 'end');
  return {
    id: data.id, name: data.name, tl,
    meta: { en: data.en, family: 'biceps-curl', equipment: ['cable'], sources: data.sources },
    muscles: [{ m: 'biceps', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.4 }],
    props: (pal) => ({ back: station.column.draw(pal) }),
    propsBox: [X - 50, station.column.box[1]], dynamic: station.dynamic,
    pose(t): Pose {
      const p = tl.at(t).p;
      const fore = lerp(-90, 54, p);
      return {
        hip: [X, STAND_HIP_Y], spine: { lumbar: -89, thoracic: -91 }, neck: -88, head: -89,
        legs: standLegs(X),
        arms: { near: { a1: -90, a2: fore, hand: fore }, far: { a1: -92, a2: fore - 2, hand: fore - 2 } },
      };
    },
  } satisfies SideExercise;
}

/** Ball-supported overhead curl. The pelvis stays centered on the ball while the high-pulley bar curls toward the face. */
export function ballOverheadCableCurl(data: Data): SideExercise {
  const tl = workTL(0.4);
  const station = cableStation(392, 52, 'end');
  const hip: Vec2 = [244, G - BALL.r - 13];
  const legs: LimbPair = {
    near: { target: [338, G - A], foot: 0, side: [0, -1] },
    far: { target: [332, G - A], foot: 0, side: [0, -1] },
  };
  return {
    id: data.id, name: data.name, tl,
    meta: { en: data.en, family: 'biceps-curl', equipment: ['cable', 'stability-ball'], sources: data.sources },
    muscles: [{ m: 'biceps', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.45 }, { m: 'delts', side: 'both', scale: 0.4 }],
    props: (pal) => ({ back: station.column.draw(pal) }),
    propsBox: [X - BALL.r, station.column.box[1]],
    dynamic: [stabilityBall<Joints>(() => ({ p: [244, G - BALL.r] }), 'back'), ...station.dynamic],
    pose(t): Pose {
      const p = tl.at(t).p;
      const fore = lerp(-90, 54, p);
      return {
        hip, spine: { lumbar: -90, thoracic: -92 }, neck: -90, head: -90, legs,
        arms: { near: { a1: -90, a2: fore, hand: fore }, far: { a1: -92, a2: fore - 2, hand: fore - 2 } },
      };
    },
  } satisfies SideExercise;
}

/** Side-lying bodyweight curl. The body stays on its side and the free forearm folds toward the near shoulder. */
export function sideLyingCurl(data: Data): SideExercise {
  const tl = workTL(0.4);
  const neck: Vec2 = [160, FLOOR - 18];
  const hip = add(neck, mul(dir(-3.8), 123.7));
  const flat = ang(sub(neck, hip));
  return {
    id: data.id, name: data.name, tl, mat: true,
    meta: { en: data.en, family: 'biceps-curl', equipment: ['bodyweight', 'mat'], sources: data.sources },
    muscles: curlMuscles(true),
    pose(t): Pose {
      const p = tl.at(t).p;
      const fore = lerp(1, -143, p);
      return {
        hip, spine: { lumbar: flat - 1, thoracic: flat + 1 }, neck: 182, head: 181,
        legs: { near: { a1: 0, a2: 0, foot: 0 }, far: { a1: 1, a2: 1, foot: 0 } },
        arms: {
          near: { a1: 1, a2: fore, hand: fore },
          far: { a1: 179, a2: 179, hand: 180 },
        },
      };
    },
  } satisfies SideExercise;
}
