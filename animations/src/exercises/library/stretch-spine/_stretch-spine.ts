// Shared poses for the stretch-spine family. The side poses keep all floor and hand contacts as targets.
// The front poses use the frontal rig only for lateral flexion and axial rotation, where the motion stays readable.
import type { Props } from '@/exercise.ts';
import type { FrontPose, FSide, Turn } from '@/rig/front.ts';
import { BODY, type Pose } from '@/rig/side.ts';
import type { Palette } from '@/draw/palettes.ts';
import { add, ang, dir, lerp, mul, sub, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import type { Vec3 } from '@/math/vec3.ts';
import { A, FLOOR, G, QUAD, kneelLeg, plantedArm, standLegs } from '@/exercises/common.ts';

/** A slow static stretch: arrive in 1.7 s, hold for 3.2 s, and return without a loop jump. */
export const stretchTL = timeline([
  { d: 1.7, from: 0, to: 1, e: [0.25, 0.85] },
  { d: 3.2, from: 1, to: 1, e: [0.85, 0.8] },
  { d: 1.7, from: 1, to: 0, e: [0.75, 0.2] },
  { d: 0.4, from: 0, to: 0, e: [0.2, 0.2] },
]);

/** Alternating dynamic stretch: each bent leg crosses in turn, with a brief transition at each side. */
export const alternatingStretchTL = timeline([
  { d: 1.1, from: -1, to: 1, e: [0.35, 0.85] },
  { d: 1.1, from: 1, to: -1, e: [0.85, 0.35] },
  { d: 0.3, from: -1, to: -1, e: [0.35, 0.35] },
]);

const STAND_HIP: Vec2 = [250, G - A - (BODY.thigh + BODY.shin - 1)];
const CHAIR_HIP: Vec2 = [242, G - 104];
const SUPINE_NECK: Vec2 = [150, FLOOR - 18];
const SUPINE_HIP: Vec2 = add(SUPINE_NECK, mul(dir(-3.8), 123.7));
const SUPINE_FLAT = -3.8;

/** Standing, straight-legged base with both arms hanging. */
export function standingSideBase(): Pose {
  return {
    hip: STAND_HIP,
    spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    legs: standLegs(STAND_HIP[0], 0),
    arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } },
  };
}

/** Hands travel from the sides to directly above the shoulders while the pelvis and feet remain fixed. */
export function standingOverheadPose(q: number): Pose {
  const arm = (far = false) => ({
    target: (J: import('@/rig/side.ts').Joints): Vec2 => {
      const S = far ? J.Sf : J.S;
      // Sweep forward in a long arc, rather than sending the wrist through the shoulder at mid-range.
      const a = (90 - 180 * q) * Math.PI / 180;
      return [S[0] + 124 * Math.cos(a), S[1] + 124 * Math.sin(a)];
    },
    side: [1, 0] as Vec2,
    hand: -90,
  });
  return { ...standingSideBase(), arms: { near: arm(), far: arm(true) } };
}

/** Kneeling cat position: wrists and knees stay planted while the lumbar and thoracic spine flex upward. */
export function catPose(q: number): Pose {
  // This compact base keeps the shoulder less than one arm length above the mat at the fully rounded position.
  // Each wrist stays directly below its shoulder; the small horizontal shift is the natural scapular glide in cat.
  const hip: Vec2 = [240, FLOOR - 76];
  const wrist = (far: boolean) => (J: import('@/rig/side.ts').Joints): Vec2 => [J.S[0] + (far ? -3 : 2), FLOOR - 7];
  return {
    hip,
    // The full rounded position keeps the palms on the mat without forcing the shoulders beyond arm length.
    spine: { lumbar: lerp(-16, -43, q), thoracic: lerp(-18, 7, q) },
    neck: lerp(-12, 25, q), head: lerp(-10, 45, q),
    legs: {
      near: { a1: 128, a2: 180, foot: 180 },
      far: { a1: 128, a2: 180, foot: 180 },
    },
    arms: {
      near: { target: wrist(false), side: [-1, 0], hand: 0 },
      far: { target: wrist(true), side: [-1, 0], hand: 0 },
    },
  };
}

/** A seated chair fold. Both feet remain flat and the hands slide to the middle of the thighs. */
export function chairForwardFoldPose(q: number): Pose {
  const spine = { lumbar: lerp(-91, -55, q), thoracic: lerp(-93, -57, q) };
  const legs = {
    near: { target: [CHAIR_HIP[0] + 100, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
    far: { target: [CHAIR_HIP[0] + 94, G - A] as Vec2, foot: 0, side: [0, -1] as Vec2 },
  };
  const thighHand = (far: boolean) => (J: import('@/rig/side.ts').Joints): Vec2 => {
    const H = far ? J.Hf : J.H;
    const K = far ? J.knee_f : J.knee_n;
    return add(H, mul(sub(K, H), 0.52));
  };
  return {
    hip: CHAIR_HIP, spine, neck: lerp(-90, -52, q), head: lerp(-89, -48, q), legs,
    arms: {
      near: { target: thighHand(false), side: [0, 1], hand: 35 },
      far: { target: thighHand(true), side: [0, 1], hand: 35 },
    },
  };
}

/** Seated floor support: legs remain extended while straight arms support a modest backward lean. */
export function seatedLeanBackPose(q: number): Pose {
  const spine = { lumbar: lerp(-91, -106, q), thoracic: lerp(-92, -108, q) };
  const hand = (far: boolean) => (J: import('@/rig/side.ts').Joints): Vec2 => [
    J.H[0] + lerp(-12, -28, q) + (far ? -4 : 0), FLOOR - 7,
  ];
  return {
    hip: [245, FLOOR - 25], spine, neck: lerp(-90, -106, q), head: lerp(-90, -105, q),
    legs: {
      near: { a1: 0, a2: 0, foot: 0 },
      far: { a1: 0, a2: 0, foot: 0 },
    },
    arms: {
      near: { target: hand(false), side: [-1, 0], hand: 180 },
      far: { target: hand(true), side: [-1, 0], hand: 180 },
    },
  };
}

/** Supine double-knee stretch. The shoulders stay on the mat while both knees draw toward the chest. */
export function kneesToChestPose(q: number): Pose {
  const thigh = lerp(-122, -136, q);
  const shin = lerp(14, 30, q);
  return {
    hip: SUPINE_HIP, spine: { lumbar: SUPINE_FLAT, thoracic: SUPINE_FLAT }, neck: 182, head: 181,
    legs: {
      near: { a1: thigh, a2: shin, foot: shin - 90 },
      far: { a1: thigh + 2, a2: shin + 2, foot: shin - 88 },
    },
    arms: {
      // The forearms travel under the thighs toward the shins; fixed directions prevent the crossed hold from
      // exceeding the side-rig span while still visibly cradling the legs below the knees.
      near: { a1: -35, a2: -55, hand: -55 },
      far: { a1: -33, a2: -53, hand: -53 },
    },
  };
}

/** Sphinx: pelvis and extended legs stay low, elbows sit under the shoulders and forearms support the lift. */
export function sphinxPose(q: number): Pose {
  const lumbar = lerp(-8, -30, q), thoracic = lerp(-8, -40, q);
  return {
    hip: [185, FLOOR - 19], spine: { lumbar, thoracic },
    neck: lerp(-10, -38, q), head: lerp(-8, -33, q),
    legs: {
      near: { a1: 178, a2: 178, foot: 180 },
      far: { a1: 178, a2: 178, foot: 180 },
    },
    arms: {
      // The initial prone position keeps the arms alongside the torso. As the chest rises,
      // the elbows move beneath the shoulders without sending either elbow through the mat.
      near: { a1: lerp(180, 90, q), a2: 0, hand: 0 },
      far: { a1: lerp(180, 90, q), a2: 0, hand: 0 },
    },
  };
}

/** Upward-facing dog: palms and the tops of the feet are fixed as the arms straighten and the thighs lift. */
export function upwardDogPose(q: number): Pose {
  const hip: Vec2 = [250, lerp(FLOOR - 17, FLOOR - 50, q)];
  const spine = { lumbar: lerp(-8, -42, q), thoracic: lerp(-12, -70, q) };
  const wrist = (far: boolean) => (J: import('@/rig/side.ts').Joints): Vec2 => [J.S[0] + (far ? -3 : 0), FLOOR - 7];
  return {
    hip, spine, neck: lerp(-14, -60, q), head: lerp(-15, -58, q),
    legs: {
      // The feet stay far behind the hips so the knees remain extended as the thighs lift.
      near: { target: [72, FLOOR - 7], side: [0, -1], foot: 180 },
      far: { target: [78, FLOOR - 7], side: [0, -1], foot: 180 },
    },
    arms: {
      near: { target: wrist(false), side: [1, 0], hand: 0 },
      far: { target: wrist(true), side: [1, 0], hand: 0 },
    },
  };
}

/** Prone scorpion: chest and palms remain on the mat while one bent leg crosses over the back, alternating sides. */
export function proneScorpionPose(p: number): Pose {
  const q = Math.abs(p);
  // Use the upward half of the angle circle (180° to 325°), not the downward 180° to -35° interpolation.
  const crossed = { a1: lerp(180, 325, q), a2: lerp(180, 150, q), foot: lerp(180, 150, q) };
  const long = { a1: 180, a2: 180, foot: 180 };
  const nearActive = p >= 0;
  return {
    hip: [200, FLOOR - 24], spine: { lumbar: 0, thoracic: 0 }, neck: 0, head: 0,
    legs: { near: nearActive ? crossed : long, far: nearActive ? long : crossed },
    // The palms are spread to either side of the chest. The profile view shows their fixed support.
    arms: {
      near: { a1: 20, a2: 0, hand: 0 },
      far: { a1: 20, a2: 0, hand: 0 },
    },
  };
}

/** Supine iron cross: shoulders and outstretched arms stay on the mat as straight legs lower together to one side. */
export function ironCrossPose(q: number): Pose {
  const leg = lerp(-90, 180, q);
  return {
    hip: SUPINE_HIP, spine: { target: SUPINE_NECK, side: [0, 1] }, neck: 180, head: 180,
    legs: {
      near: { a1: leg, a2: leg, foot: leg - 90 },
      far: { a1: leg + 2, a2: leg + 2, foot: leg - 88 },
    },
    arms: {
      near: { a1: 180, a2: 180, hand: 180 },
      far: { a1: 180, a2: 180, hand: 180 },
    },
  };
}

/** Supine cross-body knee stretch: one leg stays long while the other bends over the pelvis toward the opposite hand. */
export function crossBodyKneePose(q: number): Pose {
  const thigh = lerp(0, -105, q);
  const shin = lerp(0, 20, q);
  return {
    hip: SUPINE_HIP, spine: { target: SUPINE_NECK, side: [0, 1] }, neck: 180, head: lerp(180, 165, q),
    legs: {
      near: { a1: 0, a2: 0, foot: 0 },
      far: { a1: thigh, a2: shin, foot: shin - 90 },
    },
    arms: {
      near: {
        // The knee begins beyond the opposite shoulder's span. The hand leaves the chest only once
        // the crossed knee is near enough to support below the joint without an IK clamp.
        target: (J) => {
          const rest: Vec2 = [J.S[0] + 65, J.S[1] - 35];
          const hold = add(J.knee_f, [-5, 8]);
          const s = Math.max(0, (q - 0.55) / 0.45);
          return [lerp(rest[0], hold[0], s), lerp(rest[1], hold[1], s)];
        }, side: [-1, 0], hand: 100,
      },
      far: { a1: 0, a2: 0, hand: 0 },
    },
  };
}

/** Camel pose: knees and heels remain planted while the pelvis glides forward and both hands stay on the heels. */
export function camelPose(q: number): Pose {
  const knee: Vec2 = [270, FLOOR - 12];
  const hip: Vec2 = [lerp(245, 270, q), FLOOR - 106];
  const thigh = ang(sub(knee, hip));
  const spine = { lumbar: lerp(130, 150, q), thoracic: lerp(170, 180, q) };
  const heel = (far: boolean) => (J: import('@/rig/side.ts').Joints): Vec2 => {
    const ankle = far ? J.ankle_f : J.ankle_n;
    return [ankle[0] - 14, ankle[1]];
  };
  return {
    hip, spine, neck: spine.thoracic, head: spine.thoracic,
    legs: {
      near: { a1: thigh, a2: 180, foot: 180 },
      far: { a1: thigh, a2: 180, foot: 180 },
    },
    arms: {
      near: { target: heel(false), side: [0, -1], hand: 180 },
      far: { target: heel(true), side: [0, -1], hand: 180 },
    },
  };
}

/** Stability-ball hug: both feet remain planted while the seated body folds over the ball without letting it roll away. */
export function ballHugPose(q: number): Pose {
  const hip: Vec2 = [250, lerp(FLOOR - 126, FLOOR - 92, q)];
  const spine = { lumbar: lerp(-92, -55, q), thoracic: lerp(-94, -58, q) };
  const hug = (far: boolean) => (J: import('@/rig/side.ts').Joints): Vec2 => [
    J.H[0] + 47 + (far ? -5 : 0), J.H[1] - 26,
  ];
  return {
    hip, spine, neck: lerp(-92, -56, q), head: lerp(-92, -54, q),
    legs: {
      near: { target: [355, G - A], foot: 0, side: [0, -1] },
      far: { target: [349, G - A], foot: 0, side: [0, -1] },
    },
    arms: {
      near: { target: hug(false), side: [0, -1], hand: 30 },
      far: { target: hug(true), side: [0, -1], hand: 30 },
    },
  };
}

/** Stability-ball lower-back stretch. Feet stay on the floor while the lumbar spine drapes over the ball. */
export function ballLowerBackPose(q: number): Pose {
  const hip: Vec2 = [268, FLOOR - 74];
  const spine = { lumbar: lerp(-105, -145, q), thoracic: lerp(-102, -138, q) };
  // Arms solve before the head frame, so use the available neck base to place both hands behind the head.
  const hand = (far: boolean) => (J: import('@/rig/side.ts').Joints): Vec2 => [J.N[0] - 16 + (far ? -4 : 0), J.N[1] - 10];
  return {
    hip, spine, neck: lerp(-100, -142, q), head: lerp(-100, -140, q),
    legs: {
      near: { target: [365, G - A], foot: 0, side: [0, -1] },
      far: { target: [359, G - A], foot: 0, side: [0, -1] },
    },
    arms: {
      near: { target: hand(false), side: [0, -1], hand: -90 },
      far: { target: hand(true), side: [0, -1], hand: -90 },
    },
  };
}

/** Stability-ball pyramid: the ball supports the high hips, with both hands and both feet fixed to the floor. */
export function ballPyramidPose(q: number): Pose {
  // Enter with the pelvis already in the upper hemisphere of the ball. The former lower
  // starting hip put the head below the mat before the pyramid began.
  const hip: Vec2 = [250, lerp(FLOOR - 136, FLOOR - 158, q)];
  const spine = { lumbar: lerp(42, 49, q), thoracic: lerp(42, 51, q) };
  const wrist = (far: boolean) => (J: import('@/rig/side.ts').Joints): Vec2 => [J.S[0] + 32 + (far ? -3 : 0), FLOOR - 7];
  return {
    hip, spine, neck: lerp(44, 52, q), head: lerp(44, 55, q),
    legs: {
      near: { target: [155, FLOOR - 7], side: [0, -1], foot: 180 },
      far: { target: [151, FLOOR - 7], side: [0, -1], foot: 180 },
    },
    arms: {
      near: { target: wrist(false), side: [-1, 0], hand: 0 },
      far: { target: wrist(true), side: [-1, 0], hand: 0 },
    },
  };
}

/** A ball is drawn as a static prop when the body rests against it, so the human remains in front. */
export function ballProps(center: Vec2, diameter = 136): (pal: Palette) => Props {
  return (pal) => ({ back: [
    { kind: 'oval', nm: 'stability-ball', color: pal.ball, c: center, s: [diameter, diameter] },
    { kind: 'oval', nm: 'stability-ball-shine', color: pal.ballShine, c: [center[0] - diameter * 0.2, center[1] - diameter * 0.24], s: [diameter * 0.22, diameter * 0.13], rot: -35 },
  ] });
}

/** Side-view chair, placed under the shared seated base. */
export function sideChairProps(pal: Palette): Props {
  return { back: [
    { kind: 'box', nm: 'chair-back', color: pal.padFar, c: [202, 319], s: [18, 118], r: 8 },
    { kind: 'box', nm: 'chair-seat', color: pal.pad, c: [244, 375], s: [128, 16], r: 7 },
    { kind: 'box', nm: 'chair-front-leg', color: pal.metalDark, c: [292, 414], s: [12, 68], r: 4 },
    { kind: 'box', nm: 'chair-back-leg', color: pal.metalDark, c: [204, 414], s: [12, 68], r: 4 },
    { kind: 'box', nm: 'chair-base', color: pal.metal, c: [248, 445], s: [118, 9], r: 4 },
  ] };
}

/** Simple front-view chair aligned with the front-rig seated pose. */
export function frontChairProps(pal: Palette): Props {
  return { back: [
    { kind: 'box', nm: 'chair-back', color: pal.padFar, c: [0, 276], s: [178, 132], r: 12 },
    { kind: 'box', nm: 'chair-seat', color: pal.pad, c: [0, 345], s: [194, 18], r: 8 },
    { kind: 'box', nm: 'chair-leg-left', color: pal.metalDark, c: [-76, 398], s: [15, 106], r: 5 },
    { kind: 'box', nm: 'chair-leg-right', color: pal.metalDark, c: [76, 398], s: [15, 106], r: 5 },
  ] };
}

const sign = (side: FSide): number => side === 'l' ? 1 : -1;
const chairLeg = (side: FSide) => ({ target: [sign(side) * 28, BODY.ankleH, 94] as Vec3, pole: [sign(side) * 0.2, 0, 1] as Vec3 });
const chairHand = (side: FSide) => (J: import('@/rig/front.ts').FrontJoints): Vec3 => [
  J.hip_l[0] * sign(side) / Math.max(1, Math.abs(J.hip_l[0])), 122, 18,
];

/** Stable upright chair base with feet planted forward of the seat. */
export function frontChairBase(): FrontPose {
  return {
    pelvis: [0, 115, 0],
    legs: { l: chairLeg('l'), r: chairLeg('r') },
    arms: {
      l: { target: [82, 122, 18], pole: [1, 0, -1] },
      r: { target: [-82, 122, 18], pole: [-1, 0, -1] },
    },
  };
}

/** Standing front-view base with planted feet. */
export function frontStandingBase(turn: Turn = {}): FrontPose {
  return {
    pelvis: [0, BODY.ankleH + 183, 0], spine: turn,
    legs: {
      l: { target: [17, BODY.ankleH, 3] },
      r: { target: [-17, BODY.ankleH, 3] },
    },
    arms: {
      l: { target: [43, BODY.ankleH + 113, 13] },
      r: { target: [-43, BODY.ankleH + 113, 13] },
    },
  };
}

/** Front lateral flexion: one hand supports the hip and the opposite hand rests behind the head. */
export function frontStandingSideBendPose(q: number): FrontPose {
  const pose = frontStandingBase({ roll: 23 * q });
  return {
    ...pose, neck: { roll: 4 * q }, head: { roll: -6 * q },
    arms: {
      l: {
        target: (J) => [J.E[0] + 14, J.E[1] - 8, J.E[2] + 12],
        pole: [1, 0, -1],
      },
      r: {
        target: (J) => [J.hip_r[0] - 7, J.hip_r[1] + 9, J.hip_r[2] + 22],
        pole: [-1, 0, -1],
      },
    },
  };
}

/** Front axial rotation with hands fixed to the hips. */
export function frontStandingTwistPose(q: number): FrontPose {
  const pose = frontStandingBase({ yaw: 60 * q });
  return {
    ...pose, neck: { yaw: 12 * q }, head: { yaw: 15 * q },
    arms: {
      l: { target: (J) => [J.hip_l[0] + 7, J.hip_l[1] + 8, J.hip_l[2] + 19], pole: [1, 0, -1] },
      r: { target: (J) => [J.hip_r[0] - 7, J.hip_r[1] + 8, J.hip_r[2] + 19], pole: [-1, 0, -1] },
    },
  };
}

/** Chair rotation with fingers interlaced behind the head and elbows wide. */
export function frontChairRotationPose(q: number): FrontPose {
  const base = frontChairBase();
  return {
    ...base, spine: { yaw: 58 * q }, neck: { yaw: 12 * q }, head: { yaw: 15 * q, pitch: 8 },
    arms: {
      l: { target: (J) => [J.E[0] + 22, J.E[1] - 5, J.E[2] + 11], pole: [1, 0, -1] },
      r: { target: (J) => [J.E[0] - 22, J.E[1] - 5, J.E[2] + 11], pole: [-1, 0, -1] },
    },
  };
}

/** Seated floor side bend: the free hand braces on the floor and the other hand stays behind the head. */
export function frontSeatedSideBendPose(q: number): FrontPose {
  return {
    pelvis: [0, 92, 0], spine: { roll: 24 * q }, neck: { roll: 5 * q }, head: { roll: -5 * q },
    legs: {
      l: { target: [53, BODY.ankleH, 105], pole: [0.8, 0, 1] },
      r: { target: [-53, BODY.ankleH, 105], pole: [-0.8, 0, 1] },
    },
    arms: {
      l: { target: (J) => [J.E[0] + 20, J.E[1] - 2, J.E[2] + 10], pole: [1, 0, -1] },
      // The rendered floor is below the seated front rig's reachable arc. This near mat-side placement keeps the
      // supporting arm braced beside the pelvis and within reach throughout the side bend.
      r: { target: [-65, 135, 20], pole: [-1, 0, -1] },
    },
  };
}

/** Chair side bend: the outside hand grips the chair while the other hand stays behind the head. */
export function frontChairSideBendPose(q: number): FrontPose {
  const base = frontChairBase();
  return {
    ...base, spine: { roll: 22 * q }, neck: { roll: 5 * q }, head: { roll: -5 * q },
    arms: {
      l: { target: (J) => [J.E[0] + 20, J.E[1] - 2, J.E[2] + 10], pole: [1, 0, -1] },
      r: { target: [-64, 145, 18], pole: [-1, 0, -1] },
    },
  };
}

/** Seated floor twist with the right knee crossed over the long opposite leg. */
export function frontSeatedTwistPose(q: number): FrontPose {
  return {
    pelvis: [0, 92, 0], spine: { yaw: 54 * q }, neck: { yaw: 12 * q }, head: { yaw: 15 * q },
    legs: {
      // The left leg reaches long along the mat. The right leg stays closer so its knee remains visibly bent and crossed.
      l: { target: [35, BODY.ankleH, 160], pole: [0.6, 0, 1] },
      r: { target: [-18, BODY.ankleH, 78], pole: [-0.4, 0, 1] },
    },
    arms: {
      // The crossed knee sits beyond a seated front rig's full arm span. These points put the forearm across the
      // near thigh and the free hand beside the hip, preserving the braced twist without an IK clamp.
      l: { target: (J) => [J.hip_l[0] + 26, J.hip_l[1] + 40, J.hip_l[2] + 62], pole: [1, 0, -1] },
      r: { target: [-60, 130, 16], pole: [-1, 0, -1] },
    },
  };
}
