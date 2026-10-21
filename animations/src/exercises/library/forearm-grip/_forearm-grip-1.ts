// Private builders for forearm-grip-1. The wrist-curl builders keep the forearms fixed on the thighs or bench.
// The hand direction alone moves, so the bar, cable handle, or band follows a true wrist-only range of motion.
// Standing holds use a stable, upright base and show the exact loaded object in the gripping hand.
import type { LibraryMeta, SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math/vec2.ts';
import type { Joints, LimbPair, Pose } from '@/rig/side.ts';
import { A, G, standLegs } from '@/exercises/common.ts';
import { bandLine, barbell, cableColumn, cableHandle, cableLine, dumbbell, flatBench, gripAt, handleEnd, heldPlate, towardCable, workTL } from '@/exercises/equipment/index.ts';

type WristImplement = 'band' | 'barbell' | 'cable';

interface WristConfig {
  id: string;
  name: string;
  en: string;
  sources: string[];
  implement: WristImplement;
  reverse: boolean;
  bench?: boolean;
}

const TL = workTL(0.45);
const SEAT_HIP: Vec2 = [218, G - 116];
const SEAT_LEGS: LimbPair = {
  near: { target: [318, G - A], foot: 0, side: [0, -1] },
  far: { target: [312, G - A], foot: 0, side: [0, -1] },
};
const SEAT_BENCH = flatBench({ view: 'side', x: 225, top: 96 });
const SUPPORT_BENCH = flatBench({ view: 'side', x: 312, top: 165, length: 210 });
const CABLE = cableColumn({ x: 82, pulleyY: G - 38, toward: 1 });

/** Wrist range: the forearm directions remain fixed. The hand rolls 52° around the stationary wrist. */
function wristHand(reverse: boolean, p: number): number {
  return reverse ? lerp(104, 48, p) : lerp(28, 84, p);
}

function seatedPose(p: number, reverse: boolean): Pose {
  return {
    hip: SEAT_HIP,
    // A modest forward trunk angle puts the elbows and forearms directly onto the upper thighs.
    spine: { lumbar: -72, thoracic: -72 }, neck: -73, head: -75,
    legs: SEAT_LEGS,
    arms: {
      near: { a1: 58, a2: 38, hand: wristHand(reverse, p) },
      far: { a1: 58, a2: 38, hand: wristHand(reverse, p) },
    },
  };
}

function benchPose(p: number, reverse: boolean): Pose {
  return {
    // Kneel close enough that both forearms lie horizontal along the raised bench pad.
    hip: [192, G - 116], spine: { lumbar: -64, thoracic: -64 }, neck: -66, head: -67,
    legs: {
      near: { a1: 70, a2: 174, foot: 180 },
      far: { a1: 70, a2: 174, foot: 180 },
    },
    arms: {
      near: { a1: 90, a2: 0, hand: wristHand(reverse, p) },
      far: { a1: 90, a2: 0, hand: wristHand(reverse, p) },
    },
  };
}

/** Build a seated or kneeling wrist curl. The load moves only through the wrist. */
export function wristCurl(c: WristConfig): SideExercise {
  const cableGrip = (J: Joints) => gripAt(J, 'n');
  const meta: LibraryMeta = {
    en: c.en, family: 'forearm-grip',
    equipment: c.implement === 'barbell' ? ['barbell', ...(c.bench ? ['bench'] as const : [])]
      : c.implement === 'band' ? ['band', 'bench'] : ['cable', 'bench'],
    sources: c.sources,
  };
  return {
    id: c.id, name: c.name, tl: TL, meta,
    muscles: [{ m: 'forearms', side: 'both' }],
    props: (pal) => ({
      back: [
        ...(c.bench ? SUPPORT_BENCH.draw(pal) : SEAT_BENCH.draw(pal)),
        ...(c.implement === 'cable' ? CABLE.draw(pal) : []),
      ],
    }),
    propsBox: c.implement === 'cable' ? [CABLE.box[0], SEAT_BENCH.box[1]] : (c.bench ? SUPPORT_BENCH.box : SEAT_BENCH.box),
    dynamic: c.implement === 'barbell'
      ? [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })]
      : c.implement === 'band'
        ? [
          bandLine((J) => [[J.ankle_n[0] + 3, G - 5], gripAt(J, 'n')], 'underNearArm', 'Near resistance band'),
          bandLine((J) => [[J.ankle_f[0] - 1, G - 5], gripAt(J, 'f')], 'overFarArm', 'Far resistance band'),
        ]
        : [
          cableLine(CABLE.pulley, (J) => {
            const p = cableGrip(J);
            return handleEnd(p, towardCable(p, CABLE.pulley));
          }, 'Low cable'),
          cableHandle('end', (J) => {
            const p = cableGrip(J);
            return { p, a: towardCable(p, CABLE.pulley) };
          }),
        ],
    pose: (t) => (c.bench ? benchPose(TL.at(t).p, c.reverse) : seatedPose(TL.at(t).p, c.reverse)),
  };
}

interface BehindConfig { id: string; name: string; en: string; sources: string[]; }

/** Bar stays behind the glutes. Only the wrist rolls the bar upward and downward. */
export function behindBackWristCurl(c: BehindConfig): SideExercise {
  return {
    id: c.id, name: c.name, tl: TL,
    meta: { en: c.en, family: 'forearm-grip', equipment: ['barbell'], sources: c.sources },
    muscles: [{ m: 'forearms', side: 'both' }],
    dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: gripAt(J, 'n') }) })],
    pose: (t) => {
      const p = TL.at(t).p;
      return {
        hip: [248, G - A - 183], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
        legs: standLegs(248, 0),
        // Elbows remain just behind the torso; only the closed hands turn toward the ceiling.
        arms: {
          near: { a1: 122, a2: 100, hand: lerp(150, 92, p) },
          far: { a1: 122, a2: 100, hand: lerp(150, 92, p) },
        },
      };
    },
  };
}

interface StandingConfig { id: string; name: string; en: string; sources: string[]; kind: 'pinch' | 'squeeze'; }

/** Build the two isometric standing grips. The timeline supplies a controlled effort hold without changing the form. */
export function standingGrip(c: StandingConfig): SideExercise {
  return {
    id: c.id, name: c.name, tl: TL,
    meta: {
      en: c.en, family: 'forearm-grip',
      equipment: c.kind === 'pinch' ? ['plate'] : ['dumbbell'], sources: c.sources,
    },
    muscles: [{ m: 'forearms', side: c.kind === 'pinch' ? 'near' : 'both' }],
    dynamic: c.kind === 'pinch'
      ? [
        // Two medium plates, smooth faces outward, are pinched together at the rim.
        heldPlate((J) => ({ p: add(gripAt(J, 'n'), [0, -5]) }), 'face', 'medium', 'front', 'Outer plate'),
        heldPlate((J) => ({ p: add(gripAt(J, 'n'), [-7, 2]) }), 'face', 'medium', 'front', 'Inner plate'),
      ]
      : [dumbbell('n', 'profile'), dumbbell('f', 'profile')],
    pose: () => ({
      hip: [244, G - A - 183], spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
      legs: standLegs(244, 0),
      arms: c.kind === 'pinch'
        ? { near: { a1: 91, a2: 90, hand: 90 }, far: { a1: 90, a2: 90, hand: 90 } }
        // Arms point forward, palms facing each other, with elbows straight but not locked.
        : { near: { a1: 8, a2: 8, hand: 0 }, far: { a1: 8, a2: 8, hand: 0 } },
    }),
  };
}

interface RotateConfig { id: string; name: string; en: string; sources: string[]; }

/** One arm rotates with a fixed elbow at shoulder height; the other hand supports the head on the bench. */
export function proneExternalRotation(c: RotateConfig): SideExercise {
  const bench = flatBench({ view: 'side', x: 247, top: 156, length: 250 });
  return {
    id: c.id, name: c.name, tl: TL,
    meta: { en: c.en, family: 'forearm-grip', equipment: ['dumbbell', 'bench'], sources: c.sources },
    muscles: [{ m: 'forearms', side: 'near' }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [dumbbell('n', 'profile')],
    pose: (t) => ({
      // Chest stays on the high bench. The near elbow is fixed at shoulder height throughout the external rotation.
      hip: [222, G - 174], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
      legs: { near: { a1: 0, a2: 0, foot: 0 }, far: { a1: 0, a2: 0, foot: 0 } },
      arms: {
        near: { a1: 180, a2: lerp(90, 180, TL.at(t).p), hand: lerp(90, 180, TL.at(t).p) },
        far: { a1: 180, a2: 180, hand: 180 },
      },
    }),
  };
}

/** Side-lying bench rotation: upper arm remains along the torso while the elbow stays at 90°. */
export function sideLyingExternalRotation(c: RotateConfig): SideExercise {
  const bench = flatBench({ view: 'side', x: 265, top: 140, length: 310 });
  return {
    id: c.id, name: c.name, tl: TL,
    meta: { en: c.en, family: 'forearm-grip', equipment: ['dumbbell', 'bench'], sources: c.sources },
    muscles: [{ m: 'forearms', side: 'near' }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box, poster: 0.31,
    dynamic: [dumbbell('n', 'profile')],
    pose: (t) => ({
      // The bench supports the torso. The upper arm remains along the trunk throughout the rotation.
      hip: [275, bench.seatY - 40], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
      farHip: 0, farShoulder: 0,
      legs: { near: { a1: 0, a2: 0, foot: 0 }, far: { a1: 0, a2: 0, foot: 0 } },
      arms: {
        near: { a1: 0, a2: lerp(88, -86, TL.at(t).p), hand: lerp(88, -86, TL.at(t).p) },
        far: { a1: 180, a2: 180, hand: 180 },
      },
    }),
  };
}

/** Chest-supported curl: the upper arms hang straight down and stay fixed as both elbows flex. */
export function proneBenchCurl(c: RotateConfig): SideExercise {
  const bench = flatBench({ view: 'side', x: 247, top: 156, length: 250 });
  return {
    id: c.id, name: c.name, tl: TL,
    meta: { en: c.en, family: 'forearm-grip', equipment: ['dumbbell', 'bench'], sources: c.sources },
    muscles: [{ m: 'forearms', side: 'both' }, { m: 'biceps', side: 'both', scale: 0.35 }],
    props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
    dynamic: [dumbbell('f', 'end'), dumbbell('n', 'end')],
    pose: (t) => {
      const p = TL.at(t).p;
      return {
        hip: [222, G - 174], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
        legs: { near: { a1: 0, a2: 0, foot: 0 }, far: { a1: 0, a2: 0, foot: 0 } },
        arms: {
          near: { a1: 90, a2: lerp(93, -45, p), hand: 0 },
          far: { a1: 90, a2: lerp(93, -45, p), hand: 0 },
        },
      };
    },
  };
}

/** Supine floor curl: legs stay long on the mat while both elbows remain beside the torso. */
export function supineFloorForearmCurl(c: RotateConfig): SideExercise {
  return {
    id: c.id, name: c.name, tl: TL, mat: true,
    meta: { en: c.en, family: 'forearm-grip', equipment: ['dumbbell'], sources: c.sources },
    muscles: [{ m: 'forearms', side: 'both' }, { m: 'biceps', side: 'both', scale: 0.35 }],
    dynamic: [dumbbell('f', 'end'), dumbbell('n', 'end')],
    poster: 0.31,
    pose: (t) => {
      const p = TL.at(t).p;
      // The arms lie in the near-side plane, clear of the trunk, then curl toward the shoulders.
      const fore = lerp(20, -115, p);
      return {
        hip: [280, 395], spine: { lumbar: 180, thoracic: 180 }, neck: 180, head: 180,
        // Straight legs descend only enough to put both ankles at normal standing height.
        legs: { near: { a1: 14, a2: 14, foot: 0 }, far: { a1: 14, a2: 14, foot: 0 } },
        arms: {
          near: { a1: 20, a2: fore, hand: fore },
          far: { a1: 20, a2: fore, hand: fore },
        },
      };
    },
  };
}
