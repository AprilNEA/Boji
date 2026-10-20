// Shared side-view builders for the chest-fly-2 exercises. The torso remains visibly supported by its bench or ball.
// Each fly keeps soft elbows and moves the dumbbells from the chest-side stretch to above the chest. Feet stay planted,
// except on the decline bench where the ankles remain under the rollers. The machine form keeps the back on its pad.
import type { FrontExercise, Props, SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math.ts';
import { add3, lerp3, mul3, norm3, type Vec3 } from '@/math3.ts';
import { type FSide, type FrontJoints } from '@/front-rig.ts';
import { BODY, type Joints, type Pose } from '@/rig.ts';
import { A, G } from '@/exercises/common.ts';
import { BALL, declineBench, dumbbell, flatBench, frontGripAt, inclineBench, stabilityBall, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.35);
const flat = flatBench({ view: 'side', x: 210 });
const incline = inclineBench({ x: 240, angle: 30 });
const incline45 = inclineBench({ x: 240, angle: 45 });
const decline = declineBench({ x: 85, angle: 20, low: 72, length: 215 });

type Support = 'flat' | 'incline' | 'incline45' | 'decline' | 'ball' | 'incline-ball' | 'incline45-ball';
type Grip = 'end' | 'profile' | 'twist';

export interface FlySpec {
  id: string;
  name: string;
  en: string;
  sources: string[];
  support: Support;
  single?: boolean;
  singleLeg?: boolean;
  grip?: Grip;
  poster?: number;
}

/** Body support and foot contacts. The side view makes the lying or reclined position readable. */
function basePose(spec: FlySpec): Omit<Pose, 'arms'> {
  if (spec.support === 'flat') {
    return {
      hip: [238, flat.seatY - 18], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
      farHip: 0, farShoulder: 0,
      legs: {
        near: { target: [348, G - A], foot: 0, side: [0, -1] },
        far: { target: [342, G - A], foot: 0, side: [0, -1] },
      },
    };
  }
  if (spec.support === 'incline') {
    return {
      // Back and head follow the 30-degree backrest. The seat carries the hips and both feet stay on the floor.
      hip: [238, incline.seatY - 18], spine: { lumbar: -160, thoracic: -160 }, neck: -160, head: -160,
      farHip: 0, farShoulder: 0,
      legs: {
        near: { target: [348, G - A], foot: 0, side: [0, -1] },
        far: { target: [342, G - A], foot: 0, side: [0, -1] },
      },
    };
  }
  if (spec.support === 'incline45') {
    return {
      // This source specifies a 45-degree bench. The back, neck and head follow that backrest.
      hip: [238, incline45.seatY - 18], spine: { lumbar: -135, thoracic: -135 }, neck: -135, head: -135,
      farHip: 0, farShoulder: 0,
      legs: {
        near: { target: [348, G - A], foot: 0, side: [0, -1] },
        far: { target: [342, G - A], foot: 0, side: [0, -1] },
      },
    };
  }
  if (spec.support === 'decline') {
    return {
      // Head is lower at the left. Bent knees hold the ankles beneath the roller at the raised end.
      hip: [206, 326], spine: { lumbar: 160, thoracic: 160 }, neck: 160, head: 160,
      farHip: 0, farShoulder: 0,
      legs: {
        near: { target: [decline.roller[0], decline.roller[1] + 5], foot: -25, side: [0, 1] },
        far: { target: [decline.roller[0] - 4, decline.roller[1] + 4], foot: -25, side: [0, 1] },
      },
    };
  }
  if (spec.support === 'incline-ball') {
    return {
      // The upper back remains on the incline pad. The ball visibly supports the lower torso.
      hip: [226, 324], spine: { lumbar: -160, thoracic: -160 }, neck: -160, head: -160,
      farHip: 0, farShoulder: 0,
      legs: {
        near: { target: [348, G - A], foot: 0, side: [0, -1] },
        far: { target: [342, G - A], foot: 0, side: [0, -1] },
      },
    };
  }
  if (spec.support === 'incline45-ball') {
    return {
      // The ball supports the pelvis while the upper back follows the 45-degree bench.
      hip: [226, 324], spine: { lumbar: -135, thoracic: -135 }, neck: -135, head: -135,
      farHip: 0, farShoulder: 0,
      legs: {
        near: { target: [348, G - A], foot: 0, side: [0, -1] },
        far: { target: [342, G - A], foot: 0, side: [0, -1] },
      },
    };
  }
  // Upper back contacts the ball top. Hips remain raised as in a supported bridge.
  // The raised leg reaches almost its full 184 px length, so it reads as a straight extension rather than a second bent support.
  const extended: Vec2 = spec.singleLeg ? [428, 330] : [342, G - A];
  return {
    hip: [246, G - BALL.r - 67], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { target: [350, G - A], foot: 0, side: [0, -1] },
      far: { target: extended, foot: spec.singleLeg ? -5 : 0, side: [0, -1] },
    },
  };
}

/** p=0 is the wide chest stretch. p=1 is the closed position above the chest. */
function flyWrist(J: Joints, p: number, far = false): Vec2 {
  const S = far ? J.Sf : J.S;
  // A circular shoulder path keeps the wrist about 124 px from the shoulder, giving a continuous soft elbow bend.
  const a = (47 - 135 * p) * (Math.PI / 180), r = 124;
  return [S[0] + r * Math.cos(a), S[1] + r * Math.sin(a)];
}

function lerpV(a: Vec2, b: Vec2, p: number): Vec2 {
  return [lerp(a[0], b[0], p), lerp(a[1], b[1], p)];
}

function freeHand(J: Joints): Vec2 {
  return add(J.Sf, [35, 55]);
}

function supportProps(spec: FlySpec): (pal: Parameters<NonNullable<SideExercise['props']>>[0]) => Props {
  if (spec.support === 'flat') return (pal) => ({ back: flat.draw(pal) });
  if (spec.support === 'incline') return (pal) => ({ back: incline.draw(pal) });
  if (spec.support === 'incline45') return (pal) => ({ back: incline45.draw(pal) });
  if (spec.support === 'decline') return (pal) => ({ back: decline.draw(pal) });
  if (spec.support === 'incline-ball') return (pal) => ({ back: incline.draw(pal) });
  if (spec.support === 'incline45-ball') return (pal) => ({ back: incline45.draw(pal) });
  return () => ({ back: [] });
}

/** Build one supported dumbbell fly. The far hand offsets with its shoulder, so both arms keep the same bend. */
export function benchFly(spec: FlySpec): SideExercise {
  const equipment = ['dumbbell'] as ('dumbbell' | 'bench' | 'stability-ball')[];
  if (spec.support !== 'ball') equipment.push('bench');
  if (spec.support === 'ball' || spec.support === 'incline-ball' || spec.support === 'incline45-ball') equipment.push('stability-ball');
  const profile = spec.grip !== 'end';
  return {
    id: spec.id,
    name: spec.name,
    tl,
    meta: { en: spec.en, family: 'chest-fly', equipment, sources: spec.sources },
    muscles: [
      { m: 'pecs' },
      { m: 'delts', side: spec.single ? 'near' : 'both', scale: 0.45 },
      ...(spec.support === 'ball' ? [{ m: 'abs' as const, scale: 0.35 }] : []),
    ],
    props: supportProps(spec),
    propsBox: spec.support === 'decline' ? decline.box : [flat.box[0], 380],
    dynamic: [
      ...(spec.support === 'ball' ? [stabilityBall<Joints>(() => ({ p: [126, G - BALL.r] }), 'back')] : []),
      ...((spec.support === 'incline-ball' || spec.support === 'incline45-ball') ? [stabilityBall<Joints>(() => ({ p: [226, G - BALL.r] }), 'back')] : []),
      ...(spec.single
        ? [dumbbell('n', profile ? 'profile' : 'end')]
        : [dumbbell('f', profile ? 'profile' : 'end'), dumbbell('n', profile ? 'profile' : 'end')]),
    ],
    // The wide position identifies a fly and reveals the bench support.
    poster: spec.poster ?? 0,
    pose(t) {
      const p = tl.at(t).p;
      const base = basePose(spec);
      return {
        ...base,
        arms: {
          // Twist variants turn from a forward palm at the stretched position to a palms-in top position.
          near: { target: (J) => flyWrist(J, p), side: [0, -1], hand: spec.grip === 'twist' ? lerp(0, -85, p) : -85 },
          far: spec.single
            ? { target: freeHand, side: [0, -1], hand: 0 }
            : { target: (J) => flyWrist(J, p, true), side: [0, -1], hand: spec.grip === 'twist' ? lerp(0, -85, p) : -85 },
        },
      };
    },
  };
}

/** The dumbbells stay level with the bench and sweep from the thighs to overhead in a semicircle. */
export function aroundWorld(): SideExercise {
  const worldTL = workTL(0.25);
  const spec: FlySpec = {
    id: 'dumbbell-supine-around-the-world', name: '哑铃仰卧环绕飞鸟', en: 'Dumbbell Supine Around-the-World',
    sources: ['fe:Around_The_Worlds'], support: 'flat', poster: 0,
  };
  return {
    id: spec.id, name: spec.name, tl: worldTL,
    meta: { en: spec.en, family: 'chest-fly', equipment: ['dumbbell', 'bench'], sources: spec.sources },
    muscles: [{ m: 'pecs' }, { m: 'delts', side: 'both', scale: 0.45 }],
    props: supportProps(spec), propsBox: [flat.box[0], 380],
    dynamic: [dumbbell('f', 'end'), dumbbell('n', 'end')], poster: 0,
    pose(t) {
      const p = worldTL.at(t).p;
      const base = basePose(spec);
      const wrist = (J: Joints, far: boolean): Vec2 => {
        const S = far ? J.Sf : J.S;
        // A constant-radius semicircle preserves the soft elbow bend. It starts by the thighs and finishes overhead.
        const a = (20 - 165 * p) * (Math.PI / 180), r = 122;
        return [S[0] + r * Math.cos(a), S[1] + r * Math.sin(a)];
      };
      return {
        ...base,
        arms: {
          near: { target: (J) => wrist(J, false), side: [0, -1], hand: 0 },
          far: { target: (J) => wrist(J, true), side: [0, -1], hand: 0 },
        },
      };
    },
  };
}

/** Front-view pec deck with a back pad, level upper arms and handles that visibly close at chest height. */
export function pecDeck(): FrontExercise {
  const machineTL = workTL(0.45);
  const sign: Record<FSide, number> = { l: 1, r: -1 };
  const reach = BODY.upper + BODY.fore - 2;
  const handleAt = (J: FrontJoints, s: FSide, p: number) => {
    // The upper arm remains level. The handles travel from a wide chest stretch to the sternum in front of the torso.
    const open: Vec3 = [sign[s] * 104, 0, 48];
    const closed: Vec3 = [-sign[s] * 20, 0, 120];
    return add3(J[`shoulder_${s}`], mul3(norm3(lerp3(open, closed, p)), reach));
  };
  const arm = (J: FrontJoints, s: FSide, p: number) => ({
    target: handleAt(J, s, p),
    // Keep both elbows just in front of the chest rather than folding behind the back pad.
    pole: add3(J.chest.F, mul3(J.chest.L, sign[s] * 0.22)),
  });
  return {
    id: 'machine-pec-deck-fly', name: '蝴蝶机夹胸', view: 'front', tl: machineTL,
    meta: {
      en: 'Machine Pec Deck Fly', family: 'chest-fly', equipment: ['machine'],
      sources: ['fe:Butterfly', 'hz:0596'],
    },
    muscles: [{ m: 'pecs' }, { m: 'delts', side: 'both', scale: 0.35 }],
    props: (pal) => ({
      back: [
        { kind: 'box', nm: 'machine-base', color: pal.metalDark, c: [0, G - 5], s: [276, 10], r: 3 },
        { kind: 'box', nm: 'weight-stack', color: pal.metal, c: [-116, 308], s: [38, 278], r: 7 },
        { kind: 'box', nm: 'weight-plates', color: pal.plate, c: [-116, 358], s: [29, 132], r: 3 },
        { kind: 'box', nm: 'back-post', color: pal.metalDark, c: [0, 319], s: [14, 224], r: 4 },
        { kind: 'box', nm: 'backrest', color: pal.pad, c: [0, 276], s: [72, 160], r: 14 },
        { kind: 'box', nm: 'seat-post', color: pal.metalDark, c: [0, 391], s: [12, 82], r: 3 },
        { kind: 'box', nm: 'seat', color: pal.pad, c: [0, 343], s: [100, 18], r: 8 },
        { kind: 'box', nm: 'top-beam', color: pal.metalDark, c: [0, 164], s: [264, 14], r: 6 },
        { kind: 'oval', nm: 'left-fly-pivot', color: pal.metalDark, c: [118, 185], s: [25, 25] },
        { kind: 'oval', nm: 'right-fly-pivot', color: pal.metalDark, c: [-118, 185], s: [25, 25] },
      ],
    }),
    propsBox: [-145, 145],
    dynamic: [
      {
        nm: 'Left Pec Deck Arm', z: 'back', kind: 'line', width: 12, color: (pal) => pal.metal,
        at: (J, t) => [[118, 185], frontGripAt(J, 'l')],
      },
      {
        nm: 'Right Pec Deck Arm', z: 'back', kind: 'line', width: 12, color: (pal) => pal.metal,
        at: (J, t) => [[-118, 185], frontGripAt(J, 'r')],
      },
      {
        nm: 'Left Pec Deck Handle', z: 'front', kind: 'rigid',
        shapes: (pal) => [{ kind: 'box', nm: 'handle', color: pal.padFar, c: [0, 0], s: [12, 42], r: 6 }],
        at: (J) => ({ p: frontGripAt(J, 'l') }),
      },
      {
        nm: 'Right Pec Deck Handle', z: 'front', kind: 'rigid',
        shapes: (pal) => [{ kind: 'box', nm: 'handle', color: pal.padFar, c: [0, 0], s: [12, 42], r: 6 }],
        at: (J) => ({ p: frontGripAt(J, 'r') }),
      },
    ],
    poster: 0,
    pose(t) {
      const p = machineTL.at(t).p;
      return {
        pelvis: [0, 140, 0], hips: { pitch: 3 }, spine: { pitch: -2 }, neck: { pitch: -2 }, head: { pitch: -2 },
        legs: {
          l: { target: [58, BODY.ankleH, 12] },
          r: { target: [-58, BODY.ankleH, 7] },
        },
        arms: {
          l: { target: (J) => arm(J, 'l', p).target, pole: (J) => arm(J, 'l', p).pole },
          r: { target: (J) => arm(J, 'r', p).target, pole: (J) => arm(J, 'r', p).pole },
        },
      };
    },
  };
}
