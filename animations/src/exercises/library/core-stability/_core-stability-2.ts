// Private pose and timing utilities for the core-stability-2 exercises.
// The helpers use fixed contacts and intentionally keep the support limbs inside IK reach.
import { add, ang, dir, lerp, lerpV, mul, sub, type Vec2 } from '@/math/vec2.ts';
import { smooth } from '@/math/timeline.ts';
import type { RigidPart } from '@/exercise.ts';
import { BODY, solve, type Joints, type LimbSpec, type Pose } from '@/rig/side.ts';
import { ARM_STRAIGHT, FLOOR, G, GRIP_IN_HAND, handOnHip, hipForShoulder, plantedArm, standLegs } from '@/exercises/common.ts';

/** A slow, controlled effort cycle for a balance hold. */
export const holdWave = (t: number): number => 0.5 - 0.5 * Math.cos(Math.PI * 2 * t);

/** High-plank geometry with both toes and both palms fixed to the mat. */
export const HIGH_PLANK_2 = (() => {
  const ankle: Vec2 = [120, FLOOR - 41];
  const body = (th: number): Omit<Pose, 'arms'> => ({
    hip: add(ankle, mul(dir(th), BODY.thigh + BODY.shin - 3)),
    farHip: 0, farShoulder: 0,
    spine: { lumbar: th, thoracic: th - 1 }, neck: th - 4, head: th + 2,
    legs: {
      near: { target: ankle, side: [0, 1], foot: 85 },
      far: { target: add(ankle, [-2, 0]), side: [0, 1], foot: 85 },
    },
  });
  const probeArms = { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } };
  const shoulderAt = (th: number): Vec2 => solve({ ...body(th), arms: probeArms }).S;
  let top = 0;
  for (let i = 0; i < 160 && shoulderAt(top)[1] > FLOOR - 128; i++) top -= 0.25;
  let bottom = top;
  for (let i = 0; i < 160 && shoulderAt(bottom)[1] < FLOOR - 57; i++) bottom += 0.25;
  const wrist: Vec2 = [shoulderAt(top)[0] + 6, FLOOR - 7];
  return { ankle, body, top, bottom, wrist, wristFar: add(wrist, [-3, 0]) as Vec2 };
})();

/** High-plank push-up with the chest descending over planted palms. */
export function widePushUpPose(p: number): Pose {
  // A full chest-to-floor bottom would over-fold this fixed-palm rig. Stop near an 80° elbow angle.
  const pressBottom = lerp(HIGH_PLANK_2.top, HIGH_PLANK_2.bottom, 0.65);
  return {
    ...HIGH_PLANK_2.body(lerp(HIGH_PLANK_2.top, pressBottom, p)),
    arms: {
      near: plantedArm(HIGH_PLANK_2.wrist),
      far: plantedArm(HIGH_PLANK_2.wristFar),
    },
  };
}

/** Shoulders move past the fixed palms while the feet remain planted. */
export function plancheLeanPose(p: number): Pose {
  const wrist: Vec2 = [HIGH_PLANK_2.wrist[0] - 25 * p, HIGH_PLANK_2.wrist[1]];
  return {
    ...HIGH_PLANK_2.body(HIGH_PLANK_2.top),
    arms: {
      near: { target: wrist, side: [-1, 0], hand: 0 },
      far: { target: add(wrist, [-3, 0]), side: [-1, 0], hand: 0 },
    },
  };
}

/** Full planche: shoulders forward of palms, locked elbows, and a single horizontal body line. */
export const fullPlanchePose = (): Pose => {
  const wrist: Vec2 = [HIGH_PLANK_2.wrist[0] - 28, FLOOR - 7];
  const shoulder: Vec2 = add(wrist, [61, -110]);
  const spine = { lumbar: 0, thoracic: 0 };
  return {
    hip: hipForShoulder(shoulder, spine), spine, neck: 0, head: 0, farHip: 0, farShoulder: 0,
    legs: {
      near: { a1: 180, a2: 180, foot: 180 },
      far: { a1: 180, a2: 180, foot: 180 },
    },
    arms: {
      near: { target: wrist, side: [-1, 0], hand: 0 },
      far: { target: (J) => add(wrist, [J.Sf[0] - J.S[0], J.Sf[1] - J.S[1]]), side: [-1, 0], hand: 0 },
    },
  };
};

/** Straddle planche: locked arms support a horizontal trunk while the straight legs split fore and aft. */
export const straddlePlanchePose = (): Pose => {
  const wrist: Vec2 = [HIGH_PLANK_2.wrist[0] - 28, FLOOR - 7];
  const shoulder: Vec2 = add(wrist, [61, -110]);
  const spine = { lumbar: 0, thoracic: 0 };
  return {
    hip: hipForShoulder(shoulder, spine), spine, neck: 0, head: 0, farHip: 0, farShoulder: 0,
    // The side view shows the straddle as one leg forward and one leg behind the trunk.
    legs: {
      near: { a1: 148, a2: 148, foot: 148 },
      far: { a1: 212, a2: 212, foot: 212 },
    },
    arms: {
      near: { target: wrist, side: [-1, 0], hand: 0 },
      far: { target: (J) => add(wrist, [J.Sf[0] - J.S[0], J.Sf[1] - J.S[1]]), side: [-1, 0], hand: 0 },
    },
  };
};

/** Frog balance with the knees supported on bent upper arms and the feet tucked clear of the floor. */
export function frogStandPose(q: number): Pose {
  const tuck = smooth(q);
  const wrist: Vec2 = [HIGH_PLANK_2.wrist[0] - 5, FLOOR - 7];
  const shoulder: Vec2 = [wrist[0] + 42, wrist[1] - 111];
  const spine = { lumbar: 0, thoracic: 0 };
  const hip = hipForShoulder(shoulder, spine);
  const leg = (far = false): LimbSpec => ({
    a1: lerp(17, 29, tuck), a2: lerp(-113, -155, tuck), foot: lerp(-105, -160, tuck) + (far ? 2 : 0),
  });
  return {
    hip, spine, neck: 0, head: 0, farHip: 0, farShoulder: 0,
    legs: { near: leg(), far: leg(true) },
    arms: {
      near: { target: wrist, side: [-1, 0], hand: 0 },
      far: { target: (J) => add(wrist, [J.Sf[0] - J.S[0], J.Sf[1] - J.S[1]]), side: [-1, 0], hand: 0 },
    },
  };
}

/** Free handstand with vertical wrists, shoulders, hips and ankles. */
export function handstandPose(sway: number): Pose {
  const wrist: Vec2 = [260, FLOOR - 7];
  const shoulder: Vec2 = [wrist[0] + sway, wrist[1] - ARM_STRAIGHT];
  const spine = { lumbar: 90, thoracic: 90 };
  return {
    hip: hipForShoulder(shoulder, spine), spine, neck: 90, head: 90, farHip: 0, farShoulder: 0,
    legs: {
      near: { a1: -90, a2: -90, foot: -90 },
      far: { a1: -90, a2: -90, foot: -90 },
    },
    arms: {
      near: { target: wrist, side: [1, 0], hand: 90 },
      far: { target: (J) => add(wrist, [J.Sf[0] - J.S[0], J.Sf[1] - J.S[1]]), side: [1, 0], hand: 90 },
    },
  };
}

/** Supine base with bent knees and both feet flat for a small posterior pelvic tilt. */
const PELVIC_TILT = (() => {
  const neck: Vec2 = [150, FLOOR - 18];
  const hip = add(neck, mul(dir(-3.8), 123.7));
  const ankle: Vec2 = [hip[0] + 106, FLOOR - 13];
  return { neck, hip, ankle, flat: ang(sub(neck, hip)) };
})();

/** Press the lower back down without bridging or lifting the hips. */
export function pelvicTiltPose(p: number): Pose {
  const lumbar = lerp(PELVIC_TILT.flat - 2, 180, p);
  return {
    hip: PELVIC_TILT.hip,
    spine: { lumbar, thoracic: lerp(PELVIC_TILT.flat, PELVIC_TILT.flat + 3, p) },
    neck: lerp(182, 180, p), head: lerp(181, 180, p), farHip: 0, farShoulder: 0,
    legs: {
      near: { target: PELVIC_TILT.ankle, foot: 0, side: [0, -1] },
      far: { target: add(PELVIC_TILT.ankle, [-5, 0]), foot: 0, side: [0, -1] },
    },
    arms: {
      near: { a1: 8, a2: 1, hand: 0 },
      far: { a1: 7, a2: 0, hand: 0 },
    },
  };
}

/** Reverse-plank base: palms and heels stay grounded while the body stays diagonally straight. */
export const REVERSE_PLANK_2 = (() => {
  const hip: Vec2 = [230, 390];
  const spine = { lumbar: 210, thoracic: 210 };
  const ankle: Vec2 = [408, FLOOR - 13];
  const upper: Omit<Pose, 'arms'> = {
    hip, spine, neck: 210, head: 210, farHip: 0, farShoulder: 0,
    legs: {
      near: { target: ankle, foot: 0, side: [0, -1] },
      far: { target: add(ankle, [-3, 0]), foot: 0, side: [0, -1] },
    },
  };
  const probe = solve({ ...upper, arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } } });
  const wrist: Vec2 = [probe.S[0] - 24, FLOOR - 7];
  const wristFar: Vec2 = add(wrist, [-3, 0]);
  const base = solve({
    ...upper,
    arms: { near: { target: wrist, side: [-1, 0], hand: 180 }, far: { target: wristFar, side: [-1, 0], hand: 180 } },
  });
  return { hip, spine, ankle, upper, wrist, wristFar, base };
})();

/** Alternate a straight leg toward the ceiling without dropping the reverse-plank hips. */
export function reversePlankLegLiftPose(t: number): Pose {
  const turn = t < 0.5 ? 'near' : 'far';
  const phase = (t % 0.5) * 2;
  const lift = holdWave(phase);
  const raised = (side: 'n' | 'f'): LimbSpec => ({
    a1: lerp(REVERSE_PLANK_2.base[`thigh_${side}`].a, -90, lift),
    a2: lerp(REVERSE_PLANK_2.base[`shin_${side}`].a, -90, lift),
    foot: lerp(0, -90, lift),
  });
  const support = (far: boolean): LimbSpec => ({
    target: far ? add(REVERSE_PLANK_2.ankle, [-3, 0]) : REVERSE_PLANK_2.ankle,
    foot: 0, side: [0, -1],
  });
  return {
    ...REVERSE_PLANK_2.upper,
    legs: {
      near: turn === 'near' ? raised('n') : support(false),
      far: turn === 'far' ? raised('f') : support(true),
    },
    arms: {
      near: { target: REVERSE_PLANK_2.wrist, side: [-1, 0], hand: 180 },
      far: { target: REVERSE_PLANK_2.wristFar, side: [-1, 0], hand: 180 },
    },
  };
}

/** Forearm plank with elbows below the shoulders and toes grounded. */
export const FOREARM_PLANK_2 = (() => {
  const ankle: Vec2 = [150, FLOOR - 41];
  const body = (breath = 0): Omit<Pose, 'arms'> => {
    const th = -6;
    return {
      hip: add(ankle, mul(dir(th), BODY.thigh + BODY.shin - 3)), farHip: 0, farShoulder: 0,
      spine: { lumbar: th - 0.4 * breath, thoracic: th - 1 - 0.8 * breath },
      neck: th - 4, head: th + 3,
      legs: {
        near: { target: ankle, side: [0, 1], foot: 85 },
        far: { target: add(ankle, [-2, 0]), side: [0, 1], foot: 85 },
      },
    };
  };
  const arms = { near: { a1: 90, a2: 0, hand: 0 }, far: { a1: 90, a2: -2, hand: -2 } };
  return { ankle, body, arms };
})();

/** Descend to one forearm at a time, then return to the planted-palm high plank. */
export function upDownPlankPose(t: number): Pose {
  const phase = t * 4;
  const near = phase < 1 ? phase : phase < 2 ? 1 : phase < 3 ? 3 - phase : 0;
  const far = phase < 1 ? 0 : phase < 2 ? phase - 1 : phase < 3 ? 1 : 4 - phase;
  const bodyP = (near + far) / 2;
  const high = HIGH_PLANK_2.body(HIGH_PLANK_2.top);
  const low = FOREARM_PLANK_2.body();
  const highJ = solve({ ...high, arms: { near: plantedArm(HIGH_PLANK_2.wrist), far: plantedArm(HIGH_PLANK_2.wristFar) } });
  const lowJ = solve({ ...low, arms: FOREARM_PLANK_2.arms });
  const arm = (side: 'n' | 'f', p: number): LimbSpec => ({
    target: lerpV(highJ[`wrist_${side}`], lowJ[`wrist_${side}`], p), side: [-1, 0],
    hand: lerp(highJ[`hand_${side}`].a, lowJ[`hand_${side}`].a, p),
  });
  const ankle = lerpV(HIGH_PLANK_2.ankle, FOREARM_PLANK_2.ankle, bodyP);
  return {
    hip: lerpV(high.hip, low.hip, bodyP),
    spine: {
      lumbar: lerp(HIGH_PLANK_2.top, -6, bodyP),
      thoracic: lerp(HIGH_PLANK_2.top - 1, -7, bodyP),
    },
    neck: lerp(HIGH_PLANK_2.top - 4, -10, bodyP), head: lerp(HIGH_PLANK_2.top + 2, -3, bodyP), farHip: 0, farShoulder: 0,
    legs: {
      near: { target: ankle, side: [0, 1], foot: 85 },
      far: { target: add(ankle, [-2, 0]), side: [0, 1], foot: 85 },
    },
    arms: { near: arm('n', near), far: arm('f', far) },
  };
}

/** Keep the knees and toes fixed while the roller travels forward under both forearms. */
export function bodySawPose(p: number): Pose {
  const ankle: Vec2 = [140, FLOOR - 41];
  // The roller and forearms travel 33 px. The toes remain fixed and leg reach stays below the 184 px rig limit.
  const th = lerp(-18, -8, p);
  const shoulder: Vec2 = [lerp(390, 423, p), FLOOR - 31 - BODY.upper];
  const spine = { lumbar: th, thoracic: th - 1 };
  return {
    hip: hipForShoulder(shoulder, spine), spine, neck: th - 4, head: th + 3, farHip: 0, farShoulder: 0,
    legs: {
      near: { target: ankle, side: [0, 1], foot: 85 },
      far: { target: add(ankle, [2, 0]), side: [0, 1], foot: 85 },
    },
    arms: { near: { a1: 90, a2: 0, hand: 0 }, far: { a1: 90, a2: -2, hand: -2 } },
  };
}

/** A compact ab wheel, seen side-on: one rolling wheel with the two handles along its axle. */
export function abWheel(at: (J: Joints, t: number) => Vec2): RigidPart {
  return {
    nm: 'Ab Wheel', kind: 'rigid', z: 'underNearArm',
    shapes: (pal) => [
      { kind: 'oval', nm: 'wheel', color: pal.plate, c: [0, 0], s: [38, 38] },
      { kind: 'ring', nm: 'wheel-hub', color: pal.metalDark, c: [0, 0], s: [14, 14], w: 3 },
      { kind: 'box', nm: 'axle', color: pal.metal, c: [0, 0], s: [56, 5], r: 2.5 },
      { kind: 'box', nm: 'handle-left', color: pal.pad, c: [-28, 0], s: [15, 9], r: 4.5 },
      { kind: 'box', nm: 'handle-right', color: pal.pad, c: [28, 0], s: [15, 9], r: 4.5 },
    ],
    at: (J, t) => ({ p: at(J, t) }),
  };
}

/** Kneeling rollout: knees stay fixed while the wheel moves forward and both arms lengthen. */
export const KNEELING_WHEEL = {
  knee: [210, FLOOR - 11] as Vec2,
  hip0: [210, FLOOR - 105] as Vec2,
  hip1: [250, FLOOR - 95] as Vec2,
  spine0: -15,
  spine1: -10,
  wheel0: 350,
  wheel1: 446,
  wheelY: FLOOR - 19,
};

export function kneelingWheelRolloutPose(p: number): Pose {
  const hip = lerpV(KNEELING_WHEEL.hip0, KNEELING_WHEEL.hip1, p);
  const spineAngle = lerp(KNEELING_WHEEL.spine0, KNEELING_WHEEL.spine1, p);
  const wrist: Vec2 = [lerp(KNEELING_WHEEL.wheel0, KNEELING_WHEEL.wheel1, p), KNEELING_WHEEL.wheelY - 9];
  const kneeAngle = ang(sub(KNEELING_WHEEL.knee, hip));
  return {
    hip, spine: { lumbar: spineAngle, thoracic: spineAngle }, neck: spineAngle - 2, head: spineAngle,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { a1: kneeAngle, a2: 178, foot: 180 },
      far: { a1: kneeAngle, a2: 178, foot: 180 },
    },
    arms: {
      near: { target: wrist, side: [-1, 0], hand: 90 },
      far: { target: wrist, side: [-1, 0], hand: 90 },
    },
  };
}

/** A standing setup rolls into an extended wheel-supported plank, then reverses the same line. */
export function standingWheelRolloutPose(p: number): Pose {
  // Standing ab-wheel rollout. The toes stay on one spot of the mat for the whole rep.
  // p 0–0.35: hinge from standing (feet flat, soft knees) until the wheel touches the mat ahead of the feet.
  // p 0.35–1: the wheel rolls forward on the mat. The hips lower and move forward, the heels rise onto the toes,
  // and the body straightens to about 10° above the floor with the arms reaching overhead.
  const TOE: Vec2 = [70, FLOOR];
  const WRIST_ON_MAT = FLOOR - 19 - 9; // wheel radius 19; the wheel centre sits 9 px below the wrist
  const L = BODY.thigh + BODY.shin - 3;
  const hinge = Math.min(1, p / 0.35);
  const roll = Math.max(0, (p - 0.35) / 0.65);
  // Foot 0° is flat and 85° is on the toes with the heel up, as in HIGH_PLANK (ankle 41 px above the mat).
  const foot = lerp(0, 85, roll);
  const d = dir(foot);
  const ankle = sub(sub(TOE, mul(d, 40)), mul([-d[1], d[0]], 13));
  // The leg direction from ankle to hip turns forward from upright (slightly behind the ankle in the hinge) to the
  // plank line. The torso turns the same way, so the path never crosses ±180°.
  const legAngle = roll > 0 ? lerp(-97, -10, roll) : lerp(-90, -97, hinge);
  const legLength = roll > 0 ? lerp(L - 8, L, roll) : lerp(L, L - 8, hinge);
  const hip = add(ankle, mul(dir(legAngle), legLength));
  const torso = roll > 0 ? lerp(52, -10, roll) : lerp(-90, 52, hinge);
  // The knee bends toward the front of the leg (the leg direction turned +90°): forward when standing, toward the
  // mat in the plank. The torso front would point backward in the hinge, so it is not used here.
  const kneeSide = dir(legAngle + 90);
  const legs = {
    near: { target: ankle, side: kneeSide, foot },
    far: { target: add(ankle, [-2, 0]), side: kneeSide, foot },
  };
  const body = {
    hip, spine: { lumbar: torso, thoracic: torso - 1 }, neck: torso - 4, head: torso + 2, farHip: 0, farShoulder: 0, legs,
  };
  const probe = solve({ ...body, arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } } });
  // Straight-arm angle that puts the wrist (and so the wheel) on the mat from this shoulder.
  const onMat = (S: Vec2) => Math.asin(Math.min(1, Math.max(-1, (WRIST_ON_MAT - S[1]) / ARM_STRAIGHT))) * 180 / Math.PI;
  const wristFor = (S: Vec2): Vec2 => {
    if (roll > 0) return add(S, mul(dir(onMat(S)), ARM_STRAIGHT));
    // During the hinge the hanging arms swing forward to the touch-down angle; the wheel never goes below the mat.
    const w = add(S, mul(dir(lerp(80, onMat(S), hinge)), lerp(118, ARM_STRAIGHT, hinge)));
    return [w[0], Math.min(w[1], WRIST_ON_MAT)];
  };
  const wrist = wristFor(probe.S);
  const arm = (target: Vec2): LimbSpec => ({ target, side: [-1, 0], hand: ang(sub(target, probe.S)) });
  return { ...body, arms: { near: arm(wrist), far: arm(add(wrist, sub(probe.Sf, probe.S))) } };
}
/** Stand facing away from the anchor, then extend the straight arms overhead into the suspension fallout. */
export function suspensionFalloutPose(p: number): Pose {
  const ankle: Vec2 = [220, FLOOR - 13];
  const hip = lerpV([220, FLOOR - 194], [300, FLOOR - 170], p);
  const th = lerp(-90, -60, p);
  const armDirection = lerp(42, -22, p);
  const arm = (far: boolean): LimbSpec => ({
    target: (J) => add(far ? J.Sf : J.S, mul(dir(armDirection), ARM_STRAIGHT)),
    side: [0, 1], hand: armDirection,
  });
  return {
    hip, spine: { lumbar: th, thoracic: th - 1 }, neck: th - 3, head: th,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { target: ankle, side: [0, 1], foot: 0 },
      far: { target: add(ankle, [-3, 0]), side: [0, 1], foot: 0 },
    },
    arms: { near: arm(false), far: arm(true) },
  };
}

/** Standing hands-on-hips vacuum setup. The chest stays tall during the abdominal draw-in. */
export function standingVacuumPose(): Pose {
  const hip: Vec2 = [260, G - BODY.ankleH - BODY.thigh - BODY.shin + 1];
  return {
    hip, spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
    farHip: 0, farShoulder: 0, legs: standLegs(260, 0),
    arms: { near: handOnHip(0), far: handOnHip(-3) },
  };
}

/** Fixed bar geometry keeps both lever grips at a reachable height above the floor. */
export const LEVER_BAR = {
  y: 0,
  frontWrist: [190, 9] as Vec2,
  backWrist: [330, 9] as Vec2,
  shoulderY: 134.7,
};

const leverArms = (wrist: Vec2): Pose['arms'] => ({
  near: { target: wrist, side: [-1, 0], hand: -90 },
  far: { target: (J) => add(wrist, sub(J.Sf, J.S)), side: [-1, 0], hand: -90 },
});

/** Full front lever: a straight horizontal body hangs from fixed straight-arm grips. */
export function frontLeverPose(): Pose {
  const spine = { lumbar: -180, thoracic: -180 };
  return {
    hip: hipForShoulder([LEVER_BAR.frontWrist[0], LEVER_BAR.shoulderY], spine), spine, neck: -180, head: -180,
    farHip: 0, farShoulder: 0,
    legs: { near: { a1: 0, a2: 0, foot: 0 }, far: { a1: 0, a2: 0, foot: 0 } },
    arms: leverArms(LEVER_BAR.frontWrist),
  };
}

/** Full back lever: a straight horizontal body hangs behind fixed straight-arm grips. */
export function backLeverPose(): Pose {
  const spine = { lumbar: 0, thoracic: 0 };
  return {
    hip: hipForShoulder([LEVER_BAR.backWrist[0], LEVER_BAR.shoulderY], spine), spine, neck: 0, head: 0,
    farHip: 0, farShoulder: 0,
    legs: { near: { a1: 180, a2: 180, foot: 180 }, far: { a1: 180, a2: 180, foot: 180 } },
    arms: leverArms(LEVER_BAR.backWrist),
  };
}

/** Raise from a passive hang into a straight front lever while the bar grips stay fixed. */
export function frontLeverRaisePose(p: number): Pose {
  const body = lerp(-90, -180, p);
  const spine = { lumbar: body, thoracic: body };
  return {
    hip: hipForShoulder([LEVER_BAR.frontWrist[0], LEVER_BAR.shoulderY], spine), spine, neck: body, head: body,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { a1: lerp(90, 0, p), a2: lerp(90, 0, p), foot: lerp(0, -90, p) },
      far: { a1: lerp(91, 1, p), a2: lerp(91, 1, p), foot: lerp(1, -89, p) },
    },
    arms: leverArms(LEVER_BAR.frontWrist),
  };
}

/** Prone ball balance: the abdomen contacts the ball, hands ground, and straight legs stay airborne. */
export function proneBallBalancePose(): Pose {
  const hip: Vec2 = [280, 316];
  const spine = { lumbar: 0, thoracic: 0 };
  return {
    hip, spine, neck: 0, head: 0, farHip: 0, farShoulder: 0,
    legs: {
      near: { a1: 180, a2: 180, foot: 180 },
      far: { a1: 180, a2: 180, foot: 180 },
    },
    arms: {
      near: { target: [420, FLOOR - 7], side: [-1, 0], hand: 0 },
      far: { target: [417, FLOOR - 7], side: [-1, 0], hand: 0 },
    },
  };
}
