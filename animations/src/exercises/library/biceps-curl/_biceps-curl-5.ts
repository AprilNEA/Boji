// Reusable curl builders for the biceps-curl-5 source records.
// Each builder keeps the upper arm stable unless the source requires a supported or machine-specific position.
// Fixed legs use floor IK targets; held weights follow the closed hand on every frame.
import type { FrontExercise, LibraryMeta, SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math/vec2.ts';
import type { Vec3 } from '@/math/vec3.ts';
import type { FrontJoints } from '@/rig/front.ts';
import { solve, type Joints, type Pose } from '@/rig/side.ts';
import { A, G, hipForShoulder, standLegs, toesDown } from '@/exercises/common.ts';
import {
  BALL, bandCurve, dumbbell, ezBar, flatBench, frontGripAt, gobletDumbbell, gripAt, heldPlate, inclineBench, leverArm, medicineBall,
  pad, preacherBench, sagPoints, seatPad, smithRails, stabilityBall, tube, weightStack, workTL,
} from '@/exercises/equipment/index.ts';

type Info = { id: string; name: string; en: string; equipment: LibraryMeta['equipment']; sources: string[] };
type Grip = 'end' | 'profile';

const X = 254;
const TL = () => workTL(0.35);
const muscles = [{ m: 'biceps' as const, side: 'both' as const }, { m: 'forearms' as const, side: 'both' as const, scale: 0.45 }];
const meta = (x: Info): LibraryMeta => ({ en: x.en, family: 'biceps-curl', equipment: x.equipment, sources: x.sources });
const PREACHER_SPINE = { lumbar: -60, thoracic: -60 };
// This is the upper-pad contact point: chest leans forward and the upper arm follows the 45-degree pad.
const PREACHER_HIP = hipForShoulder([260, 238], PREACHER_SPINE);

/** A standing curl uses about 167 degrees at the bottom and 40 degrees at the top. */
function standingPose(p: number, options: { far?: number; rearToe?: boolean } = {}): Pose {
  const rear = options.rearToe ?? false;
  const rearHeight = rear ? 34 : A;
  return {
    // The hip is directly over the planted ankle. This gives both knees and hips a tall 178-degree standing position.
    hip: [X, G - A - 183.7],
    spine: { lumbar: -89, thoracic: -91 }, neck: -88, head: -89,
    legs: rear
      ? {
          near: { target: [X, G - A], foot: 0, side: [1, 0] },
          // The rear toe lands behind a person who faces screen right.
          far: { target: [X - (options.far ?? 58), G - rearHeight], foot: toesDown(rearHeight), side: [1, 0] },
        }
      : standLegs(X, options.far ?? -3),
    arms: {
      near: { a1: 91, a2: lerp(86, -52, p), hand: lerp(86, -52, p) },
      far: { a1: 93, a2: lerp(88, -50, p), hand: lerp(88, -50, p) },
    },
  };
}

/** Standard bilateral dumbbell curl. Profile weights make the neutral-to-rotated grip readable. */
export function standingDumbbell(info: Info, options: { profile?: boolean; stork?: boolean; armBlaster?: boolean } = {}): SideExercise {
  const tl = TL();
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles,
    props: options.armBlaster ? (pal) => ({
      // The neck strap and curved plate brace both upper arms without covering the elbows.
      front: [
        { kind: 'poly', nm: 'arm-blaster-strap', color: pal.metalDark, pts: [[196, 162], [221, 214], [244, 214]], w: 5, smooth: true, closed: false },
        { kind: 'poly', nm: 'arm-blaster', color: pal.metal, pts: [[209, 213], [235, 207], [258, 216], [249, 232], [225, 230]], smooth: true },
        { kind: 'box', nm: 'arm-blaster-rim', color: pal.metalDark, c: [234, 219], s: [45, 5], r: 2, rot: 8 },
      ],
    }) : undefined,
    dynamic: [dumbbell('f', options.profile ? 'profile' : 'end'), dumbbell('n', options.profile ? 'profile' : 'end')],
    pose: (t) => standingPose(tl.at(t).p, options.stork ? { far: 62, rearToe: true } : {}),
  };
}

/** EZ-bar curl; the side view shows the loaded near end while both hands follow the same shaft. */
export function standingEzBar(info: Info, options: { band?: boolean; armBlaster?: boolean } = {}): SideExercise {
  const tl = TL();
  const barAt = (J: Joints) => ({ p: gripAt(J, 'n') });
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles,
    props: options.armBlaster ? (pal) => ({
      front: [
        { kind: 'poly', nm: 'arm-blaster-strap', color: pal.metalDark, pts: [[196, 162], [222, 214], [246, 214]], w: 5, smooth: true, closed: false },
        { kind: 'poly', nm: 'arm-blaster', color: pal.metal, pts: [[209, 213], [235, 207], [258, 216], [249, 232], [225, 230]], smooth: true },
      ],
    }) : undefined,
    dynamic: [
      ...(options.band ? [
        bandCurve<Joints>((J) => sagPoints([X + 8, G - 5], add(gripAt(J, 'n'), [-8, 0]), 9), 'underNearArm', 'Left Resistance Band'),
        bandCurve<Joints>((J) => sagPoints([X + 18, G - 5], add(gripAt(J, 'n'), [8, 0]), 9), 'underNearArm', 'Right Resistance Band'),
      ] : []),
      ezBar({ view: 'side', at: barAt }),
    ],
    pose: (t) => standingPose(tl.at(t).p),
  };
}

/** Front view exposes the EZ-bar's handle spacing: close, standard, and wide grips stay visibly different. */
export function frontEzBarCurl(info: Info, grip: 'close' | 'standard' | 'wide'): FrontExercise {
  const tl = TL();
  // The inner, middle, and outer angled EZ-bar handles are about 80, 100, and 126 px apart.
  const halfGrip = grip === 'close' ? 40 : grip === 'wide' ? 63 : 50;
  const arm = (side: 'l' | 'r', p: number) => {
    const sign = side === 'l' ? 1 : -1;
    return {
      target: (J: FrontJoints): Vec3 => [sign * halfGrip, J[`shoulder_${side}`][1] + lerp(-120, -49, p), 16],
      pole: [sign * 0.45, 0, -1] as Vec3,
      // The hand faces forward so the palms stay under the bar in the supinated curl grip.
      dir: [0, 0, 1] as Vec3,
    };
  };
  return {
    id: info.id, name: info.name, view: 'front', tl, meta: meta(info), muscles,
    dynamic: [ezBar<FrontJoints>({
      view: 'front',
      at: (J) => {
        const l = frontGripAt(J, 'l'), r = frontGripAt(J, 'r');
        return { p: [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2] };
      },
    })],
    pose: (t) => {
      const p = tl.at(t).p;
      return {
        pelvis: [0, A + 183.7, 0], hips: { pitch: 1 }, spine: { pitch: -1 }, head: { pitch: -2 },
        legs: { l: { target: [28, A, 2] }, r: { target: [-28, A, 2] } },
        arms: { l: arm('l', p), r: arm('r', p) },
      };
    },
  };
}

/** Seated preacher position with the chest behind the pad and upper arms lying along its top surface. */
function preacherPose(p: number): Pose {
  return {
    hip: PREACHER_HIP, spine: PREACHER_SPINE, neck: -60, head: -58,
    legs: {
      near: { target: [PREACHER_HIP[0] + 74, G - A], foot: 0, side: [0, -1] },
      far: { target: [PREACHER_HIP[0] + 68, G - A], foot: 0, side: [0, -1] },
    },
    arms: {
      // Upper arms trace the 45 degree preacher pad. Only the forearms rotate.
      near: { a1: 45, a2: lerp(60, -95, p), hand: lerp(60, -95, p) },
      far: { a1: 47, a2: lerp(62, -93, p), hand: lerp(62, -93, p) },
    },
  };
}

export function preacherDumbbell(info: Info, options: { profile?: boolean; standing?: boolean } = {}): SideExercise {
  const tl = TL();
  const stand = options.standing;
  const bench = preacherBench({ x: stand ? 246 : 252, y: stand ? 151 : 244, seatX: stand ? 178 : 207, seatTop: stand ? 66 : 114 });
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles,
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [dumbbell('f', options.profile ? 'profile' : 'end'), dumbbell('n', options.profile ? 'profile' : 'end')],
    pose: (t) => {
      const p = tl.at(t).p;
      if (!stand) return preacherPose(p);
      const pose = standingPose(p);
      return {
        ...pose,
        arms: {
          near: { a1: 45, a2: lerp(60, -95, p), hand: lerp(60, -95, p) },
          far: { a1: 47, a2: lerp(62, -93, p), hand: lerp(62, -93, p) },
        },
      };
    },
  };
}

export function preacherEzBar(info: Info, options: { profile?: boolean } = {}): SideExercise {
  const tl = TL();
  const bench = preacherBench({ x: 252, y: 244, seatX: 207, seatTop: 114 });
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles,
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [ezBar<Joints>({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t) => preacherPose(tl.at(t).p),
  };
}

/** Upright seated EZ-bar curl. The thighs support the upper arms as the forearms flex. */
export function seatedEzBar(info: Info, options: { concentration?: boolean } = {}): SideExercise {
  const tl = TL();
  const bench = flatBench({ view: 'side', x: 236, top: 98, length: 174 });
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles,
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [ezBar<Joints>({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t) => {
      const p = tl.at(t).p;
      if (options.concentration) {
        return {
          hip: [219, G - 111], spine: { lumbar: -50, thoracic: -43 }, neck: -42, head: -39,
          legs: {
            near: { target: [315, G - A], foot: 0, side: [0, -1] },
            far: { target: [308, G - A], foot: 0, side: [0, -1] },
          },
          // The visible elbow stays against the inner upper thigh as the bar curls upward.
          arms: {
            near: { a1: 74, a2: lerp(72, -70, p), hand: lerp(72, -70, p) },
            far: { a1: 76, a2: lerp(74, -68, p), hand: lerp(74, -68, p) },
          },
        };
      }
      return {
        hip: [222, G - 108], spine: { lumbar: -94, thoracic: -92 }, neck: -91, head: -91,
        legs: {
          near: { target: [320, G - A], foot: 0, side: [0, -1] },
          far: { target: [314, G - A], foot: 0, side: [0, -1] },
        },
        arms: {
          near: { a1: 78, a2: lerp(85, -58, p), hand: lerp(85, -58, p) },
          far: { a1: 80, a2: lerp(87, -56, p), hand: lerp(87, -56, p) },
        },
      };
    },
  };
}

/** Spider curl: chest stays on a 45-degree incline while the upper arms hang vertically below the shoulders. */
export function spiderEzBar(info: Info): SideExercise {
  const tl = TL();
  const bench = inclineBench({ x: 260, angle: 45, top: 104, back: 166, seat: 48, facing: -1 });
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles,
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [ezBar<Joints>({ view: 'side', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t) => {
      const p = tl.at(t).p;
      return {
        // The sternum rests on the sloped pad; the toes remain grounded behind the hips.
        hip: [220, 332], spine: { lumbar: -45, thoracic: -45 }, neck: -45, head: -45,
        legs: {
          near: { target: [150, G - A], foot: 0, side: [-1, 0] },
          far: { target: [143, G - A], foot: 0, side: [-1, 0] },
        },
        arms: {
          near: { a1: 90, a2: lerp(90, -56, p), hand: lerp(90, -56, p) },
          far: { a1: 92, a2: lerp(92, -54, p), hand: lerp(92, -54, p) },
        },
      };
    },
  };
}

/** Supine curls use a deliberately high flat bench, so the extended arms can hang safely above the floor. */
export function supineDumbbell(info: Info, options: { profile?: boolean } = {}): SideExercise {
  const tl = TL();
  const bench = flatBench({ view: 'side', x: 251, top: 155, length: 252 });
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles,
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [dumbbell('f', options.profile ? 'profile' : 'end'), dumbbell('n', options.profile ? 'profile' : 'end')],
    pose: (t) => {
      const p = tl.at(t).p;
      return {
        // Back and head remain on the bench. Bent knees keep both feet flat on the floor.
        hip: [266, G - 160], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
        legs: {
          near: { target: [352, G - A], foot: 0, side: [0, -1] },
          far: { target: [345, G - A], foot: 0, side: [0, -1] },
        },
        arms: {
          near: { a1: 90, a2: lerp(88, -52, p), hand: lerp(88, -52, p) },
          far: { a1: 92, a2: lerp(90, -50, p), hand: lerp(90, -50, p) },
        },
      };
    },
  };
}

/** A seated ball curl keeps feet flat and the pelvis centered on the ball. */
export function ballCurl(info: Info, options: { bosu?: boolean; medicine?: boolean } = {}): SideExercise {
  const tl = TL();
  const ballY = G - BALL.r;
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles: options.bosu
      ? [...muscles, { m: 'delts' as const, side: 'both' as const, scale: 0.3 }]
      : muscles,
    props: options.bosu ? (pal) => ({ back: [
      // A BOSU is a shallow half-dome on a rigid base, not a small stability ball.
      { kind: 'poly', nm: 'BOSU dome', color: pal.ball, pts: [[189, G], [191, G - 16], [198, G - 32], [212, G - 48], [228, G - 56], [250, G - 56], [266, G - 48], [280, G - 32], [287, G - 16], [289, G]], smooth: true },
      { kind: 'box', nm: 'BOSU base', color: pal.padFar, c: [239, G - 3], s: [104, 8], r: 3 },
    ] }) : undefined,
    dynamic: [
      ...(options.bosu ? [] : [stabilityBall(() => ({ p: [239, ballY] }), 'back')]),
      ...(options.medicine
        ? [medicineBall<Joints>((J) => ({ p: add(gripAt(J, 'n'), [5, 0]) }), 'front', 58)]
        : [dumbbell('f', 'end'), dumbbell('n', 'end')]),
    ],
    pose: (t) => {
      const p = tl.at(t).p;
      const bosu = options.bosu;
      return {
        hip: bosu ? [236, G - 60] : [236, ballY - 40],
        spine: bosu ? { lumbar: -116, thoracic: -112 } : { lumbar: -103, thoracic: -100 },
        neck: bosu ? -108 : -96, head: bosu ? -106 : -94,
        legs: {
          near: { target: [bosu ? 356 : 316, G - A], foot: 0, side: [0, -1] },
          far: { target: [bosu ? 349 : 309, G - A], foot: 0, side: [0, -1] },
        },
        arms: {
          near: { a1: 88, a2: lerp(86, -52, p), hand: lerp(86, -52, p) },
          far: { a1: 90, a2: lerp(88, -56, p), hand: lerp(88, -56, p) },
        },
      };
    },
  };
}

/** One two-handed plate stays level while both elbows flex beside the upright torso. */
export function plateCurl(info: Info): SideExercise {
  const tl = TL();
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles,
    dynamic: [heldPlate((J) => ({ p: add(gripAt(J, 'n'), [5, 0]) }), 'face', 'medium', 'front')],
    pose: (t) => standingPose(tl.at(t).p),
  };
}

/** A waiter curl visibly uses one vertical dumbbell cupped by both palms, not two separate weights. */
export function waiterCurl(info: Info): SideExercise {
  const tl = TL();
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles,
    dynamic: [gobletDumbbell()],
    pose: (t) => standingPose(tl.at(t).p),
  };
}

/** Smith curl keeps the loaded end of the fixed-rail bar on one vertical rail. */
export function smithCurl(info: Info): SideExercise {
  const tl = TL();
  // The rail sits just in front of the torso. The hands travel from waist to shoulder height on that rail.
  const rails = smithRails({ view: 'side', x: 280, top: 45 });
  const wrist = (p: number): Vec2 => [280, lerp(274, 190, p)];
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles,
    props: (pal) => ({ back: rails.draw(pal) }), propsBox: rails.box,
    dynamic: [ezBar({ view: 'side', at: (_J, t) => ({ p: wrist(tl.at(t).p) }), nm: 'Smith Bar' })],
    pose: (t) => {
      const p = tl.at(t).p;
      const W = wrist(p);
      return {
        hip: [X, G - A - 183.7], spine: { lumbar: -89, thoracic: -91 }, neck: -88, head: -89,
        legs: standLegs(X, -3),
        arms: {
          // The Smith rail fixes the bar path. The elbows follow the small path needed to keep both hands on it.
          near: { target: W, side: [-1, 0], hand: 90 },
          far: { target: (J) => add(W, [J.Sf[0] - J.S[0], J.Sf[1] - J.S[1]]), side: [-1, 0], hand: 90 },
        },
      };
    },
  };
}

type MachineKind = 'plain' | 'preacher';
/** Selectorized curl machines pivot at the elbow line; their handle follows the forearm and lifts the stack. */
export function machineCurl(info: Info, options: { kind: MachineKind; hammer?: boolean } ): SideExercise {
  const tl = TL();
  const preacher = options.kind === 'preacher';
  const basePose = preacher ? preacherPose(0) : {
    hip: [218, G - 108] as Vec2, spine: { lumbar: -94, thoracic: -92 }, neck: -91, head: -91,
    legs: {
      near: { target: [316, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
      far: { target: [309, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
    },
    arms: { near: { a1: 90, a2: 86, hand: 86 }, far: { a1: 92, a2: 88, hand: 88 } },
  } satisfies Pose;
  const elbow = solve(basePose).elbow_n;
  const stack = weightStack({ x: 139, top: 112, lift: (t) => 26 * tl.at(t).p });
  const handleAngle = (t: number) => preacher ? lerp(60, -95, tl.at(t).p) : lerp(86, -52, tl.at(t).p);
  return {
    id: info.id, name: info.name, tl, meta: meta(info), muscles,
    props: (pal) => ({ back: [
      ...stack.fixed(pal),
      tube(pal, 'machine-base', [124, G - 5], [314, G - 5], { dark: true, w: 14 }),
      tube(pal, 'machine-upright', [176, G - 8], [176, 208], { w: 14 }),
      tube(pal, 'machine-link', [176, 208], elbow, { dark: true, w: 10 }),
      ...(preacher ? [
        pad(pal, 'preacher-arm-pad', [285, 281], [16, 104], -45),
        seatPad(pal, 207, G - 114, 78),
        tube(pal, 'seat-post', [207, G - 5], [207, G - 103], { dark: true, w: 12 }),
      ] : [
        pad(pal, 'backrest', [194, 281], [18, 146], 0),
        seatPad(pal, 225, G - 97, 82),
        tube(pal, 'back-post', [194, G - 7], [194, 351], { dark: true, w: 12 }),
      ]),
    ] }), propsBox: [stack.box[0], 330],
    dynamic: [
      stack.dynamic,
      leverArm({
        nm: 'Curl Lever', pivot: elbow, length: 66, angle: (_J, t) => handleAngle(t), z: 'underNearArm', w: 9,
        extra: (pal) => [
          { kind: 'box', nm: options.hammer ? 'hammer-handle' : 'supinated-handle', color: pal.padFar, c: [66, 0], s: options.hammer ? [10, 25] : [26, 9], r: 4 },
        ],
      }),
    ],
    pose: (t) => {
      const p = tl.at(t).p;
      if (preacher) return preacherPose(p);
      return {
        ...basePose,
        arms: {
          near: { a1: 90, a2: lerp(86, -52, p), hand: lerp(86, -52, p) },
          far: { a1: 92, a2: lerp(88, -56, p), hand: lerp(88, -56, p) },
        },
      };
    },
  };
}
