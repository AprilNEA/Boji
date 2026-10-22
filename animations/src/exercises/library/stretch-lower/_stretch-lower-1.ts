// Private lower-stretch builders for stretch-lower-1. Each pose preserves floor, bench, or hand contacts.
// Static stretches ease into the visible end range, hold it, then return to the exact initial pose.
import type { LibraryMeta, MuscleSpec, PropShape, SideExercise } from '@/exercise.ts';
import { add, len, lerp, mul, polar, sub, type Vec2 } from '@/math/vec2.ts';
import { timeline, type Timeline } from '@/math/timeline.ts';
import type { Palette } from '@/draw/palettes.ts';
import { BODY, type Joints, type Pose } from '@/rig/side.ts';
import { A, FLOOR, G, QUAD, hipForShoulder, plantedArm } from '@/exercises/common.ts';

export const stretchTL: Timeline = timeline([
  { d: 1.7, from: 0, to: 1, ease: 'sine', e: [0.2, 1] },
  { d: 3.2, from: 1, to: 1, e: [1, 0.95] },
  { d: 1.7, from: 1, to: 0, ease: 'sine', e: [0.95, 0.2] },
  { d: 0.5, from: 0, to: 0, e: [0.2, 0.2] },
]);

export const libraryMeta = (en: string, equipment: LibraryMeta['equipment'], sources: string[]): LibraryMeta =>
  ({ en, family: 'stretch-lower', equipment, sources });

export function lowerStretch(spec: {
  id: string; name: string; meta: LibraryMeta; muscles: MuscleSpec[]; pose: (p: number) => Pose;
  mat?: boolean; props?: (pal: Palette) => { back?: PropShape[]; front?: PropShape[] };
  propsBox?: [number, number]; dynamic?: SideExercise['dynamic']; poster?: number;
}): SideExercise {
  return {
    id: spec.id, name: spec.name, tl: stretchTL, meta: spec.meta, muscles: spec.muscles,
    mat: spec.mat ?? true, props: spec.props, propsBox: spec.propsBox, dynamic: spec.dynamic,
    poster: spec.poster ?? (1.7 + 1.6) / stretchTL.total,
    pose: (t) => spec.pose(stretchTL.at(t).p),
  };
}

const floorArms = (near: [number, number], far: [number, number] = near) => ({
  near: { a1: near[0], a2: near[1], hand: near[1] },
  far: { a1: far[0], a2: far[1], hand: far[1] },
});

/** Supine base, head left and feet right. The spine rests parallel to the mat. */
export function supineBase(legs: Pose['legs'], arms = floorArms([180, 180])): Pose {
  const hip: Vec2 = [262, FLOOR - 30];
  return { hip, spine: { target: [142, FLOOR - 22], side: [0, 1] }, neck: 180, head: 180,
    farHip: 0, farShoulder: 0, legs, arms };
}

/** One hip stays at 90 degrees; the knee extends from 90 degrees to straight. */
export function supineNinety(p: number): Pose {
  return supineBase({
    near: { a1: -90, a2: lerp(0, -90, p), foot: -90 }, far: { a1: 0, a2: 0, foot: 0 },
  }, floorArms([180, 180], [180, 180]));
}

/** A straight raised leg moves across the trunk. The view shows the taut strap-assisted endpoint. */
export function supineRaised(p: number, angle = -105): Pose {
  return supineBase({
    near: { a1: lerp(-38, angle, p), a2: lerp(-38, angle, p), foot: lerp(-20, -90, p) },
    far: { a1: 0, a2: 0, foot: 0 },
  }, floorArms([180, 180], [180, 180]));
}

/** Both knees travel toward the chest; the lumbar spine remains on the mat. */
export function kneesToChest(p: number): Pose {
  const a = lerp(0, -133, p), b = lerp(0, -58, p);
  return supineBase({ near: { a1: a, a2: b, foot: b - 16 }, far: { a1: a + 4, a2: b - 4, foot: b - 18 } },
    floorArms([lerp(180, -38, p), lerp(180, -55, p)], [lerp(180, -34, p), lerp(180, -50, p)]));
}

/** `target`, or the point `reach` away from `from` toward `target` when `target` is farther than that. */
const reachToward = (from: Vec2, target: Vec2, reach: number): Vec2 => {
  const d = sub(target, from), l = len(d);
  return l <= reach ? target : add(from, mul(d, reach / l));
};

/** Prone base. The working knee bends while the hand follows toward the ankle. */
export function proneQuad(p: number, lift = 0): Pose {
  const hip: Vec2 = [258, FLOOR - 30 - lift * p];
  return {
    // A prone figure faces right: the chest and head are right of the pelvis.
    hip, spine: { lumbar: 2, thoracic: 2 }, neck: 0, head: 0, farHip: 0, farShoulder: 0,
    // The calf folds toward the head and stops near 155° of knee flexion, so the heel nears the glute without the
    // calf lying flat on the thigh.
    legs: { near: { a1: 180, a2: lerp(180, 335, p), foot: lerp(180, 320, p) }, far: { a1: 180, a2: 180, foot: 180 } },
    arms: {
      // The near hand reaches back toward the ankle as the knee bends and holds it once the ankle comes within
      // reach. The reach stops 2 px short of the full arm length so the arm never locks.
      near: {
        target: (J) => reachToward(J.S, polar(J.ankle_n, lerp(180, 320, p), 6), BODY.upper + BODY.fore - 2),
        side: [0, -1],
      },
      far: { a1: 180, a2: 180, hand: 180 },
    },
  };
}

/** Side-lying quadriceps stretch with the bottom knee bent to stabilize the torso. */
export function sideQuad(p: number): Pose {
  const hip: Vec2 = [255, FLOOR - 48];
  return {
    // Keep the face and chest right; the top calf folds toward the head.
    hip, spine: { lumbar: 0, thoracic: 0 }, neck: 0, head: 0, farHip: 0, farShoulder: 0,
    legs: { near: { a1: 180, a2: 315, foot: 315 }, far: { a1: 180, a2: lerp(180, 315, p), foot: lerp(180, 290, p) } },
    arms: floorArms([180, 180], [180, lerp(180, 220, p)]),
  };
}

/** The upper leg lowers from a bench-supported position while the bottom leg stays bent. */
export function sideAdductor(p: number): Pose {
  const hip: Vec2 = [205, FLOOR - 42], ankle: Vec2 = [320, lerp(G - 90, G - A, p)];
  return {
    hip, spine: { target: [112, FLOOR - 50], side: [0, 1] }, neck: 180, head: 180, farHip: 0, farShoulder: 0,
    legs: { near: { a1: 5, a2: 175, foot: 180 }, far: { target: ankle, side: [0, -1], foot: 0 } },
    arms: floorArms([176, 176]),
  };
}

/** Side-lying groin stretch: the upper knee draws toward the shoulder. */
export function sideGroin(p: number): Pose {
  const hip: Vec2 = [251, FLOOR - 48];
  return {
    hip, spine: { target: [142, FLOOR - 61], side: [0, 1] }, neck: 180, head: 180, farHip: 0, farShoulder: 0,
    legs: { near: { a1: 5, a2: 175, foot: 180 }, far: { a1: lerp(-18, -104, p), a2: lerp(-18, 72, p), foot: lerp(-18, 72, p) } },
    arms: floorArms([176, 176], [lerp(2, -52, p), lerp(2, 90, p)]),
  };
}

/** Four-point base: one knee flexes from a reachable partial hold to a full quadriceps stretch. */
export function quadrupedQuad(p: number): Pose {
  // Extend the hip behind the torso, then fold the shin toward the head and hand.
  const a2 = lerp(330, 340, p);
  return {
    hip: QUAD.hip, spine: QUAD.spine, neck: -12, head: -10, farHip: 0, farShoulder: 0,
    legs: { near: { a1: 135, a2, foot: lerp(330, 340, p) }, far: { a1: 90, a2: 178, foot: 180 } },
    arms: { near: { target: (J: Joints) => J.ankle_n, side: [-1, 0], hand: -100 }, far: plantedArm(QUAD.wristFar) },
  };
}

/** Hips shift forward over a rear kneeling knee. The front foot stays flat. */
export function halfKneel(p: number): Pose {
  const backKnee: Vec2 = [185, FLOOR - 11], hip: Vec2 = add(backKnee, [lerp(12, 47, p), -93]);
  return {
    hip, farHip: 0, spine: { lumbar: lerp(-90, -95, p), thoracic: lerp(-91, -93, p) }, neck: -88, head: -89,
    legs: { near: { target: [293, G - A], foot: 0, side: [1, 0] }, far: { target: backKnee, foot: 180, side: [1, 0] } },
    // Both hands rest lightly on the forward thigh; fixed directions retain reachable elbows through the hip glide.
    arms: floorArms([66, 91], [69, 94]),
  };
}

/** Standing lunge: pelvis shifts toward the front leg while the rear heel stays down. */
export function standingRunner(p: number): Pose {
  // At the end, the rear leg is within 1 px of full reach (knee about 175°).
  const hip: Vec2 = [lerp(230, 249, p), G - A - 150];
  return {
    hip, farHip: 0, spine: { lumbar: -84, thoracic: -86 }, neck: -88, head: -88,
    legs: { near: { target: [290, G - A], foot: 0, side: [1, 0] }, far: { target: [143, G - A], foot: 0, side: [1, 0] } },
    arms: floorArms([65, 93], [69, 96]),
  };
}

/** Runner's lunge: a wide rear stance stays planted while the hips lift slightly. */
export function runnersLunge(p: number): Pose {
  // This reach gives a bent front knee (about 100°) and a long rear leg (about 160°) at the poster.
  const spine = { lumbar: lerp(-5, -2, p), thoracic: lerp(-8, -5, p) }, hand: Vec2 = [278, FLOOR - 8];
  const hip = hipForShoulder([hand[0], hand[1] - 121], spine);
  return {
    hip, spine, neck: lerp(-6, -3, p), head: lerp(-4, -2, p), farHip: 0, farShoulder: 0,
    legs: { near: { target: [254, G - A], foot: 0, side: [1, 0] }, far: { target: [33, G - A], foot: 0, side: [1, 0] } },
    arms: { near: plantedArm(hand), far: plantedArm(add(hand, [-25, 0])) },
  };
}

/** Seated floor position with one leg long; the torso hinges toward the long thigh. */
export function seatedLongLeg(p: number, handToFoot = false): Pose {
  const hip: Vec2 = [166, G - 78], spine = { lumbar: lerp(-88, -30, p), thoracic: lerp(-90, -32, p) };
  return {
    hip, spine, neck: lerp(-88, -32, p), head: lerp(-90, -35, p), farHip: 0, farShoulder: 0,
    legs: { near: { a1: 10, a2: 30, foot: handToFoot ? -20 : 0 }, far: { a1: 54, a2: -143, foot: 165 } },
    arms: floorArms([lerp(66, 17, p), lerp(86, 18, p)], [lerp(72, 22, p), lerp(88, 20, p)]),
  };
}

/** Seated calf stretch: a long dorsiflexed leg and a folded support leg. */
export function seatedCalf(p: number): Pose {
  const hip: Vec2 = [166, G - 78], spine = { lumbar: lerp(-89, -48, p), thoracic: lerp(-90, -51, p) };
  return {
    hip, spine, neck: lerp(-89, -51, p), head: lerp(-90, -53, p), farHip: 0, farShoulder: 0,
    legs: { near: { a1: 19, a2: 19, foot: -28 }, far: { a1: 58, a2: -142, foot: 164 } },
    arms: floorArms([lerp(68, 24, p), lerp(88, 28, p)], [lerp(74, 28, p), lerp(92, 32, p)]),
  };
}

/** Seated hamstring stretch: the long-leg knee stays straight through a deep hip hinge. */
export function seatedHamstring(p: number): Pose {
  const hip: Vec2 = [166, G - 78], spine = { lumbar: lerp(-88, -29, p), thoracic: lerp(-90, -31, p) };
  return {
    hip, spine, neck: lerp(-88, -31, p), head: lerp(-90, -34, p), farHip: 0, farShoulder: 0,
    // The far knee folds with its foot against the long leg's inner thigh.
    legs: { near: { a1: 19, a2: 19, foot: -8 }, far: { a1: 51, a2: -147, foot: 164 } },
    arms: floorArms([lerp(66, 17, p), lerp(86, 18, p)], [lerp(72, 22, p), lerp(88, 20, p)]),
  };
}

/** Seated butterfly. The soles stay together while the torso folds slightly. */
export function seatedButterfly(p: number, handsHead = false): Pose {
  const hip: Vec2 = [193, G - 89];
  return {
    hip, spine: { lumbar: lerp(-90, -44, p), thoracic: lerp(-90, -47, p) }, neck: lerp(-90, -48, p), head: lerp(-90, -50, p), farHip: 0,
    legs: { near: { a1: 43, a2: 176, foot: 180 }, far: { a1: 48, a2: 171, foot: 180 } },
    arms: handsHead ? floorArms([lerp(-72, 28, p), lerp(-110, 70, p)], [lerp(-78, 34, p), lerp(-108, 76, p)])
      : floorArms([lerp(58, 37, p), lerp(116, 92, p)], [lerp(62, 42, p), lerp(120, 95, p)]),
  };
}

/** Figure-four seated glute stretch with one ankle crossed above the opposite thigh. */
export function seatedGlute(p: number): Pose {
  const hip: Vec2 = [178, G - 82];
  return {
    hip, spine: { lumbar: lerp(-89, -76, p), thoracic: lerp(-90, -78, p) }, neck: -87, head: -88, farHip: 0,
    // Keep the crossed knee flexed on its anatomical side throughout the opening motion.
    legs: { near: { a1: 12, a2: 31, foot: 0 }, far: { a1: lerp(58, -4, p), a2: lerp(228, 166, p), foot: lerp(165, 166, p) } },
    arms: floorArms([lerp(70, 50, p), lerp(88, 64, p)], [lerp(74, 22, p), lerp(93, 48, p)]),
  };
}

/** Seated piriformis twist with a bent foot outside the long knee. */
export function seatedPiriformis(p: number): Pose {
  const hip: Vec2 = [170, G - 82];
  return {
    hip, spine: { lumbar: lerp(-89, -70, p), thoracic: lerp(-90, -72, p) }, neck: lerp(-89, -70, p), head: lerp(-90, -68, p), farHip: 0,
    legs: { near: { a1: 10, a2: 30, foot: 0 }, far: { a1: lerp(53, 50, p), a2: lerp(-141, -155, p), foot: 165 } },
    arms: floorArms([lerp(72, 22, p), lerp(92, 75, p)], [lerp(76, 18, p), lerp(95, 58, p)]),
  };
}

/** Wide seated fold. The feet remain at mat height through the hip hinge. */
export function seatedWideFold(p: number): Pose {
  const hip: Vec2 = [184, G - 75];
  return {
    hip, spine: { lumbar: lerp(-90, -34, p), thoracic: lerp(-90, -37, p) }, neck: lerp(-90, -40, p), head: lerp(-90, -43, p), farHip: 0,
    legs: { near: { a1: 8, a2: 31, foot: -6 }, far: { a1: 18, a2: 22, foot: -5 } },
    arms: floorArms([lerp(68, 19, p), lerp(90, 22, p)], [lerp(73, 24, p), lerp(94, 24, p)]),
  };
}

/** Chair-edge pose with the long heel and the supporting foot both fixed on the floor. */
export function chairLongLeg(p: number): Pose {
  const hip: Vec2 = [201, G - 102];
  return {
    hip, spine: { lumbar: lerp(-89, -58, p), thoracic: lerp(-90, -60, p) }, neck: lerp(-88, -62, p), head: lerp(-90, -64, p), farHip: 0,
    // Targets keep the extended heel and the tucked support foot on the floor through the hinge.
    legs: { near: { target: [361, G - A], foot: -16, side: [1, 0] }, far: { target: [180, G - A], foot: 0, side: [1, 0] } },
    arms: floorArms([lerp(74, 38, p), lerp(91, 47, p)], [lerp(79, 43, p), lerp(96, 51, p)]),
  };
}

/** Tall stand: the pelvis moves forward while the rear foot stays elevated on the bench. */
export function benchStandingQuad(p: number): Pose {
  const hip: Vec2 = [lerp(250, 272, p), G - A - 183];
  return {
    hip, spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, farHip: 0,
    legs: { near: { target: [265, G - A], foot: 0, side: [1, 0] }, far: { target: [145, G - 90], foot: 180, side: [1, 0] } },
    arms: floorArms([80, 96]),
  };
}

/** Supine bench position with one knee flexed down beside the pad. */
export function benchSupineQuad(p: number): Pose {
  const hip: Vec2 = [265, G - 116];
  return {
    hip, spine: { target: [145, G - 116], side: [0, 1] }, neck: 180, head: 180, farHip: 0, farShoulder: 0,
    legs: { near: { a1: 0, a2: lerp(30, 90, p), foot: lerp(0, 155, p) }, far: { a1: 0, a2: 0, foot: 0 } },
    arms: floorArms([lerp(0, 22, p), lerp(30, 55, p)], [180, 180]),
  };
}

/** Rock back from hands-and-knees while both hands remain planted. */
export function rockingFrog(p: number): Pose {
  // The chest lowers as the hips travel rearward, keeping the planted wrists inside the arm reach envelope.
  const hip: Vec2 = [lerp(QUAD.hip[0], QUAD.hip[0] - 43, p), QUAD.hip[1] + 20 * p];
  return {
    hip, spine: QUAD.spine, neck: -12, head: -10, farHip: 0, farShoulder: 0,
    legs: { near: { target: [QUAD.K[0] - 28 * p, QUAD.K[1]], foot: 180, side: [1, 0] }, far: { target: [QUAD.K[0] - 34 * p, QUAD.K[1]], foot: 180, side: [1, 0] } },
    arms: { near: plantedArm(QUAD.wrist), far: plantedArm(QUAD.wristFar) },
  };
}

export const benchProps = (draw: (pal: Palette) => PropShape[]) => (pal: Palette) => ({ back: draw(pal) });
