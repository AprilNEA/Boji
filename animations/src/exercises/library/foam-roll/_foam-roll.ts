// Shared side-view builders for the foam-roll work list.
// Each pose keeps the stated floor contacts fixed while the roller travels under the named tissue.
// Individual wrappers provide the catalog names, source records, and the specific release position.
import type { FrontExercise, LibraryMeta, RigidPart, SideExercise } from '@/exercise.ts';
import { add, ang, dir, lerp, lerpV, mul, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { BODY, type Joints, type LimbPair, type Pose } from '@/rig/side.ts';
import { toeDir, type FrontJoints, type FrontPose } from '@/rig/front.ts';
import { A, FLOOR, G } from '@/exercises/common.ts';
import { foamRoller } from '@/exercises/equipment/index.ts';

type Catalog = { id: string; name: string; en: string; sources: string[] };

const releaseTL = timeline([
  { d: 1.8, from: 0, to: 1, e: [0.25, 0.75] },
  { d: 3.2, from: 1, to: 1, e: [0.75, 0.7] },
  { d: 1.8, from: 1, to: 0, e: [0.65, 0.25] },
  { d: 0.5, from: 0, to: 0, e: [0.25, 0.25] },
]);

const floorArms = (): LimbPair => ({
  near: { a1: 178, a2: 178, hand: 178 },
  far: { a1: 176, a2: 176, hand: 176 },
});

/** Crossed, protracted arms expose the upper back without pulling the neck forward. */
const crossedArms = (): LimbPair => ({
  near: {
    target: (J: Joints) => add(add(J.B(0.64), mul(J.A(0.64), 29)), mul(J.T(0.64), 4)),
    side: [0, -1], hand: -90,
  },
  far: {
    target: (J: Joints) => add(add(J.B(0.64), mul(J.A(0.64), 33)), mul(J.T(0.64), 10)),
    side: [0, -1], hand: -90,
  },
});

const supineLegs = (hip: Vec2): LimbPair => {
  const ankle: Vec2 = [hip[0] + 106, FLOOR - A];
  return {
    near: { target: ankle, foot: 0, side: [0, -1] },
    far: { target: add(ankle, [-5, 0]), foot: 0, side: [0, -1] },
  };
};

const meta = (x: Catalog): LibraryMeta => ({
  en: x.en, family: 'foam-roll', equipment: ['foam-roller'], sources: x.sources,
});

/** Back roll with long legs: pressure moves from the sacrum toward the upper back. */
export function backRoll(x: Catalog): SideExercise {
  const hip: Vec2 = [271, FLOOR - 49];
  const roller = (p: number): Vec2 => [lerp(244, 174, p), lerp(FLOOR - 30, FLOOR - 72, p)];
  const pose = (): Pose => ({
    hip,
    // The torso reclines progressively upward from the pelvis to the shoulder blades.
    spine: { lumbar: -157, thoracic: -142 }, neck: -145, head: -148,
    legs: {
      near: { a1: 2, a2: 2, foot: 0 },
      far: { a1: 3, a2: 3, foot: 1 },
    },
    arms: floorArms(),
  });
  return {
    id: x.id, name: x.name, tl: releaseTL, mat: true, meta: meta(x),
    muscles: [{ m: 'upperBack' }, { m: 'lowerBack', scale: 0.45 }, { m: 'hamstrings', side: 'both', scale: 0.3 }],
    dynamic: [foamRoller((_J, t) => ({ p: roller(releaseTL.at(t).p) }), 'end', 'back')],
    poster: (1.8 + 1.6) / releaseTL.total,
    pose: () => pose(),
  } satisfies SideExercise;
}

/** Hips remain raised while a transverse roller shifts beside the lower back, never on the spine. */
export function lowerBackRoll(x: Catalog): SideExercise {
  const neck: Vec2 = [146, FLOOR - 18];
  const hip: Vec2 = add(neck, mul(dir(-35), 124));
  // The roller top meets the lower back while its lower edge remains visible below the shirt.
  const roller = (p: number): Vec2 => [lerp(228, 210, p), lerp(FLOOR - 25, FLOOR - 35, p)];
  const pose = (): Pose => ({
    hip,
    spine: { target: neck, side: [0, 1] }, neck: 181, head: 180,
    legs: supineLegs(hip), arms: crossedArms(),
  });
  return {
    id: x.id, name: x.name, tl: releaseTL, mat: true, meta: meta(x),
    muscles: [{ m: 'lowerBack' }, { m: 'glutes', scale: 0.45 }, { m: 'abs', scale: 0.3 }],
    dynamic: [foamRoller((_J, t) => ({ p: roller(releaseTL.at(t).p) }), 'end', 'back')],
    poster: (1.8 + 1.6) / releaseTL.total,
    pose: () => pose(),
  } satisfies SideExercise;
}

/** Hips stay off the mat and crossed arms protract the shoulders as the roller tracks across the rhomboids. */
export function rhomboidRoll(x: Catalog): SideExercise {
  const neck: Vec2 = [145, FLOOR - 39];
  const hip: Vec2 = add(neck, mul(dir(-26), 124));
  // Keep the roller visible below the shoulder blades instead of hiding it behind the torso layer.
  const roller = (p: number): Vec2 => [lerp(171, 151, p), lerp(FLOOR - 24, FLOOR - 33, p)];
  const pose = (): Pose => ({
    hip,
    spine: { target: neck, side: [0, 1] }, neck: 180, head: 179,
    legs: supineLegs(hip), arms: crossedArms(),
  });
  return {
    id: x.id, name: x.name, tl: releaseTL, mat: true, meta: meta(x),
    muscles: [{ m: 'upperBack' }, { m: 'traps', scale: 0.5 }, { m: 'glutes', scale: 0.35 }],
    dynamic: [foamRoller((_J, t) => ({ p: roller(releaseTL.at(t).p) }), 'end', 'back')],
    poster: (1.8 + 1.6) / releaseTL.total,
    pose: () => pose(),
  } satisfies SideExercise;
}

/** Hands and the free foot support a lifted seated position while one long leg rests on the roller. */
export function seatedLegRoll(x: Catalog, area: 'calf' | 'hamstring'): SideExercise {
  const hip: Vec2 = [250, FLOOR - 95];
  const rollerAt = (J: Joints, t: number): { p: Vec2 } => {
    const p = releaseTL.at(t).p;
    // Keep the roller tangent to the selected posterior segment throughout the roll.
    const u = area === 'calf' ? lerp(0.24, 0.78, p) : lerp(0.82, 0.18, p);
    const limb = area === 'calf'
      ? lerpV(J.knee_n, J.ankle_n, u)
      : lerpV(J.H, J.knee_n, u);
    return { p: add(limb, [0, 29]) };
  };
  const pose = (): Pose => ({
    hip,
    // The torso stays reclined so the hands can bear weight without excessive shoulder extension.
    spine: { lumbar: 179, thoracic: 178 }, neck: 177, head: 178,
    // Near: relaxed working leg. Far: the planted support foot fixes a knee that points toward the ceiling.
    legs: {
      near: { a1: 16, a2: 16, foot: 0 },
      far: { target: [380, G - A], side: [0, -1], foot: 0 },
    },
    arms: {
      near: { target: [151, FLOOR - 7], side: [0, -1], hand: 0 },
      far: { target: [146, FLOOR - 7], side: [0, -1], hand: 0 },
    },
  });
  return {
    id: x.id, name: x.name, tl: releaseTL, mat: true, meta: meta(x),
    muscles: area === 'calf'
      ? [{ m: 'calves', side: 'near' }, { m: 'triceps', side: 'both', scale: 0.35 }]
      : [{ m: 'hamstrings', side: 'near' }, { m: 'triceps', side: 'both', scale: 0.35 }],
    dynamic: [foamRoller(rollerAt, 'end', 'back')],
    poster: (1.8 + 1.6) / releaseTL.total,
    pose: () => pose(),
  } satisfies SideExercise;
}

/** Side support: the lower leg relaxes onto the roller and the upper foot crosses in front for balance. */
export function sideLegRoll(x: Catalog, area: 'thigh' | 'lower-leg'): SideExercise {
  // A horizontal side-lying trunk keeps the working leg clear of the mat.
  const hip: Vec2 = [250, FLOOR - 78];
  const rollerAt = (J: Joints, t: number): { p: Vec2 } => {
    const p = releaseTL.at(t).p;
    // The cylinder stays against the outer thigh or lower leg and never cuts through it.
    const u = area === 'thigh' ? lerp(0.82, 0.18, p) : lerp(0.24, 0.78, p);
    const limb = area === 'thigh'
      ? lerpV(J.H, J.knee_n, u)
      : lerpV(J.knee_n, J.ankle_n, u);
    return { p: add(limb, [0, 29]) };
  };
  const pose = (): Pose => ({
    hip,
    spine: { lumbar: 179, thoracic: 178 }, neck: 177, head: 178,
    // The near leg is the lower relaxed leg. The far foot crosses in front and bears only balance weight.
    legs: {
      near: { a1: 0, a2: 0, foot: 0 },
      far: { target: [282, G - A], side: [0, -1], foot: 0 },
    },
    arms: {
      // The near forearm supports the upper body; the far arm remains clear of the roller.
      near: { target: [202, FLOOR - 7], side: [0, -1], hand: 0 },
      far: { a1: -34, a2: -34, hand: -34 },
    },
  });
  return {
    id: x.id, name: x.name, tl: releaseTL, mat: true, meta: meta(x),
    muscles: area === 'thigh'
      ? [{ m: 'abductors', side: 'near' }, { m: 'triceps', side: 'both', scale: 0.3 }]
      : [{ m: 'calves', side: 'near' }, { m: 'triceps', side: 'both', scale: 0.3 }],
    dynamic: [foamRoller(rollerAt, 'end', 'back')],
    poster: (1.8 + 1.6) / releaseTL.total,
    pose: () => pose(),
  } satisfies SideExercise;
}

/** Outer upper arm presses into the roller; hips stay lifted and the feet provide the second support. */
export function brachialisRoll(x: Catalog): SideExercise {
  const hip: Vec2 = [260, FLOOR - 92];
  const roller = (p: number): Vec2 => [lerp(163, 178, p), lerp(FLOOR - 34, FLOOR - 42, p)];
  const pose = (): Pose => ({
    hip,
    spine: { lumbar: 179, thoracic: 178 }, neck: 177, head: 178,
    legs: {
      near: { a1: 18, a2: 18, foot: 0 },
      far: { a1: 20, a2: 20, foot: 1 },
    },
    // The near upper arm is vertical onto the roller; the bent forearm keeps the hand clear of the floor.
    arms: {
      near: { a1: 91, a2: 180, hand: 180 },
      far: { target: [145, FLOOR - 7], side: [0, -1], hand: 0 },
    },
  });
  return {
    id: x.id, name: x.name, tl: releaseTL, mat: true, meta: meta(x),
    muscles: [{ m: 'biceps', side: 'near' }, { m: 'triceps', side: 'far', scale: 0.3 }],
    dynamic: [foamRoller((_J, t) => ({ p: roller(releaseTL.at(t).p) }), 'end', 'back')],
    poster: (1.8 + 1.6) / releaseTL.total,
    pose: () => pose(),
  } satisfies SideExercise;
}

/** Roller sits just behind the armpit under the lat while the working arm reaches behind the body. */
export function latRoll(x: Catalog): SideExercise {
  const hip: Vec2 = [258, FLOOR - 82];
  // Keep the lower edge visible: its top still contacts the lateral back behind the armpit.
  const roller = (p: number): Vec2 => [lerp(182, 199, p), lerp(FLOOR - 43, FLOOR - 50, p)];
  const pose = (): Pose => ({
    hip,
    spine: { lumbar: 179, thoracic: 178 }, neck: 177, head: 178,
    legs: {
      near: { a1: 16, a2: 16, foot: 0 },
      far: { a1: 18, a2: 18, foot: 1 },
    },
    // Reaching up and back opens the lat without pushing the head out of line.
    arms: {
      near: { a1: 211, a2: 211, hand: 211 },
      far: { target: [148, FLOOR - 7], side: [0, -1], hand: 0 },
    },
  });
  return {
    id: x.id, name: x.name, tl: releaseTL, mat: true, meta: meta(x),
    muscles: [{ m: 'lats', side: 'near' }, { m: 'triceps', side: 'far', scale: 0.3 }],
    dynamic: [foamRoller((_J, t) => ({ p: roller(releaseTL.at(t).p) }), 'end', 'back')],
    poster: (1.8 + 1.6) / releaseTL.total,
    pose: () => pose(),
  } satisfies SideExercise;
}

/** Prone forearm support, with one relaxed thigh on the roller and its foot held off the floor. */
export function quadricepsRoll(x: Catalog): SideExercise {
  const hip: Vec2 = [259, FLOOR - 99];
  const roller = (p: number): Vec2 => [lerp(225, 284, p), lerp(FLOOR - 74, FLOOR - 61, p)];
  const pose = (): Pose => ({
    hip,
    spine: { lumbar: -5, thoracic: -7 }, neck: -10, head: -8,
    // The working near thigh travels back from the hip and stays elevated by the roller.
    legs: {
      near: { a1: 176, a2: 176, foot: 176 },
      far: { a1: 164, a2: 164, foot: 164 },
    },
    arms: {
      near: { target: [403, FLOOR - 7], side: [0, 1], hand: 0 },
      far: { target: [398, FLOOR - 7], side: [0, 1], hand: 0 },
    },
  });
  return {
    id: x.id, name: x.name, tl: releaseTL, mat: true, meta: meta(x),
    muscles: [{ m: 'quads', side: 'near' }, { m: 'delts', side: 'both', scale: 0.35 }],
    dynamic: [foamRoller((_J, t) => ({ p: roller(releaseTL.at(t).p) }), 'end', 'back')],
    poster: (1.8 + 1.6) / releaseTL.total,
    pose: () => pose(),
  } satisfies SideExercise;
}

/** A compact handheld massage roller with end caps and side handles. */
const massageRoller = <J>(at: (J: J, t: number) => { p: Vec2; a?: number }): RigidPart<J> => ({
  nm: 'Massage Roller', kind: 'rigid', z: 'front', at,
  shapes: (pal) => [
    { kind: 'box', nm: 'roller-body', color: pal.roller, c: [0, 0], s: [14, 54], r: 7 },
    { kind: 'box', nm: 'roller-shine', color: pal.rollerFace, c: [-3, 0], s: [3, 40], r: 1.5 },
    { kind: 'box', nm: 'upper-handle', color: pal.metalDark, c: [0, -33], s: [8, 14], r: 4 },
    { kind: 'box', nm: 'lower-handle', color: pal.metalDark, c: [0, 33], s: [8, 14], r: 4 },
  ],
});

/** Seated glute release: one ankle crosses the opposite knee while weight shifts onto that buttock. */
export function piriformisRoll(x: Catalog): FrontExercise {
  const pose = (t: number): FrontPose => {
    const p = releaseTL.at(t).p;
    return {
      // Lateral shift puts pressure on the buttock of the crossed leg while the roller remains transverse.
      pelvis: [lerp(-15, 15, p), 87, 0],
      spine: { pitch: 8 }, head: { pitch: -5 },
      legs: {
        // Figure's left ankle rests on the other thigh; the right foot is the planted base.
        l: { target: [-37, 83, 74], pole: [1, 0, 1], dir: toeDir([0, 0, 1]) },
        r: { target: [-42, BODY.ankleH, 76], pole: [-1, 0, 1] },
      },
      arms: {
        l: { target: (J: FrontJoints) => [J.shoulder_l[0] + 36, J.shoulder_l[1] - 56, 34] },
        r: { target: (J: FrontJoints) => [J.shoulder_r[0] - 34, J.shoulder_r[1] - 58, 32] },
      },
    };
  };
  return {
    id: x.id, name: x.name, view: 'front', tl: releaseTL, mat: true,
    meta: { en: x.en, family: 'foam-roll', equipment: ['foam-roller'], sources: x.sources },
    muscles: [{
      m: 'glutes', side: 'l',
      // In this front seated view the highlighted release area is the visible side of the shifted buttock.
      region: { view: 'front', part: 'pelvis', c: [19, 1], s: [19, 23] },
    }],
    dynamic: [foamRoller<FrontJoints>(() => ({ p: [0, G - 71] }), 'long', 'back')],
    poster: (1.8 + 1.6) / releaseTL.total,
    pose,
  } satisfies FrontExercise;
}

/** Seated, forward-leaning setup lets both hands roll the outer shin without reaching beyond the rig. */
export function tibialisMassage(x: Catalog): SideExercise {
  const hip: Vec2 = [215, FLOOR - 92];
  const rollerAt = (J: Joints, t: number): { p: Vec2; a: number } => {
    const p = releaseTL.at(t).p;
    const point = lerpV(J.knee_n, J.ankle_n, lerp(0.24, 0.78, p));
    return { p: add(point, [8, 0]), a: ang([J.ankle_n[0] - J.knee_n[0], J.ankle_n[1] - J.knee_n[1]]) - 90 };
  };
  const pose = (t: number): Pose => {
    // Hands grip the upper handle, rather than the roller centre, while it travels down the shin.
    const hand = (J: Joints): Vec2 => add(rollerAt(J, t).p, [-4, -20]);
    return {
      hip,
      spine: { lumbar: -45, thoracic: -48 }, neck: -50, head: -47,
      legs: {
        near: { target: [326, G - A], foot: 0, side: [0, -1] },
        far: { target: [316, G - A], foot: 0, side: [0, -1] },
      },
      arms: {
        near: { target: hand, side: [0, 1], hand: -85 },
        far: { target: (J: Joints) => add(hand(J), [-5, -8]), side: [0, 1], hand: -85 },
      },
    };
  };
  return {
    id: x.id, name: x.name, tl: releaseTL, mat: true,
    meta: { en: x.en, family: 'foam-roll', equipment: ['other'], sources: x.sources },
    muscles: [{ m: 'calves', side: 'near' }, { m: 'forearms', side: 'both', scale: 0.3 }],
    dynamic: [massageRoller(rollerAt)],
    poster: (1.8 + 1.6) / releaseTL.total,
    pose,
  } satisfies SideExercise;
}

/** Seated neck release: the roller stays off the midline and travels down the posterior neck muscles. */
export function neckMassage(x: Catalog): SideExercise {
  const hip: Vec2 = [231, FLOOR - 91];
  const rollerAt = (J: Joints, t: number): { p: Vec2 } => {
    const p = releaseTL.at(t).p;
    // Screen-left is posterior for the side-view figure, so the roller avoids the cervical midline.
    return { p: [J.N[0] - 22, lerp(J.N[1] - 7, J.N[1] + 15, p)] };
  };
  const pose = (t: number): Pose => ({
    hip,
    spine: { lumbar: -96, thoracic: -98 }, neck: -96, head: -95,
    legs: {
      near: { target: [hip[0] + 96, G - A], foot: 0, side: [0, -1] },
      far: { target: [hip[0] + 90, G - A], foot: 0, side: [0, -1] },
    },
    // Both hands reach behind the head to steady the roller rather than pressing on the spinal midline.
    arms: {
      near: { target: (J: Joints) => add(rollerAt(J, t).p, [-6, -4]), side: [-1, 0], hand: 180 },
      far: { target: (J: Joints) => add(rollerAt(J, t).p, [-9, 5]), side: [-1, 0], hand: 180 },
    },
  });
  return {
    id: x.id, name: x.name, tl: releaseTL, mat: true,
    meta: { en: x.en, family: 'foam-roll', equipment: ['other'], sources: x.sources },
    muscles: [{ m: 'neck' }, { m: 'forearms', side: 'both', scale: 0.3 }],
    dynamic: [massageRoller(rollerAt)],
    poster: (1.8 + 1.6) / releaseTL.total,
    pose,
  } satisfies SideExercise;
}
