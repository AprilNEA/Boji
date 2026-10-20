// Shared, private poses for the core-stability-1 exercises.
// The bases keep planted contacts as IK targets and use conservative reach values.
import { add, ang, dir, lerp, mul, smooth, sub, type Vec2 } from '@/math.ts';
import { BODY, solve, type LimbSpec, type Pose } from '@/rig.ts';
import { A, FLOOR, G, plantedArm, standLegs } from '@/exercises/common.ts';

/** Upright stance with a two-hand press that moves from the sternum to near-straight arms. */
export function pallofPose(p: number): Pose {
  const hip: Vec2 = [260, G - A - BODY.thigh - BODY.shin + 1];
  const spine = { lumbar: -90, thoracic: -90 };
  const arm = (far = false): LimbSpec => ({
    target: (J) => add(far ? J.Sf : J.S, [lerp(36, 119, p), lerp(13, 3, p)]),
    side: [0, 1], hand: 0,
  });
  return {
    hip, spine, neck: -90, head: -90, legs: standLegs(260, 0),
    arms: { near: arm(), far: arm(true) },
  };
}

/** High-plank geometry with feet and both supporting hands fixed to the mat. */
export const HIGH_PLANK = (() => {
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
  // A high plank uses almost-straight supporting elbows. Keep the shoulder about 124 px above the palm;
  // the remaining reach allows the small front/back offset without overextending the rig.
  for (let i = 0; i < 160 && shoulderAt(top)[1] > FLOOR - 7 - 124; i++) top -= 0.25;
  let bottom = top;
  for (let i = 0; i < 160 && shoulderAt(bottom)[1] < FLOOR - 7 - 50; i++) bottom += 0.25;
  const wrist: Vec2 = [shoulderAt(top)[0], FLOOR - 7];
  return { ankle, body, top, bottom, wrist, wristFar: add(wrist, [-3, 0]) as Vec2 };
})();

/** Alternating high-plank shoulder tap. Each half of the loop returns to two planted hands. */
export function shoulderTapPose(t: number): Pose {
  const nearTurn = t < 0.5;
  const phase = (t % 0.5) * 2;
  const q = 0.5 - 0.5 * Math.cos(Math.PI * 2 * phase);
  const tap = (far: boolean): LimbSpec => ({
    target: (J) => add(far ? J.S : J.Sf, [16, 20]), side: [0, 1], hand: 20,
  });
  return {
    ...HIGH_PLANK.body(HIGH_PLANK.top),
    arms: {
      near: nearTurn && q > 0.001 ? tap(false) : plantedArm(HIGH_PLANK.wrist),
      far: !nearTurn && q > 0.001 ? tap(true) : plantedArm(HIGH_PLANK.wristFar),
    },
  };
}

// This torso height puts the supporting elbows close to 90°, as required for the low spider-plank start.
const SPIDER_BODY = HIGH_PLANK.body(-12);
const PLANK_PROBE = solve({ ...SPIDER_BODY, arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) } });

/** Low-plank same-side knee drive. The folded ankle stays clear of the floor. */
export function spiderPose(t: number): Pose {
  const nearTurn = t < 0.5;
  const phase = (t % 0.5) * 2;
  const q = smooth(0.5 - 0.5 * Math.cos(Math.PI * 2 * phase));
  const drive = (far: boolean): LimbSpec => ({
    // Travel through the upward arc (rather than linearly through 90° downward) before the knee comes forward.
    // The final 386° is equivalent to 26° and leaves the folded ankle safely above the mat.
    a1: lerp(PLANK_PROBE[`thigh_${far ? 'f' : 'n'}`].a, 386, q),
    a2: lerp(PLANK_PROBE[`shin_${far ? 'f' : 'n'}`].a, -140, q),
    foot: lerp(85, -100, q),
  });
  return {
    ...SPIDER_BODY,
    legs: {
      near: nearTurn ? drive(false) : SPIDER_BODY.legs.near,
      far: nearTurn ? SPIDER_BODY.legs.far : drive(true),
    },
    arms: { near: plantedArm(HIGH_PLANK.wrist), far: plantedArm(HIGH_PLANK.wristFar) },
  };
}

/** Forearms under the shoulders with a long, level trunk and toes on the mat. */
export const FOREARM_PLANK = (() => {
  const ankle: Vec2 = [150, FLOOR - 41];
  const body = (breath: number): Omit<Pose, 'arms'> => {
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
  return { body, arms: { near: { a1: 90, a2: 0, hand: 0 }, far: { a1: 90, a2: -2, hand: -2 } } };
})();

export interface RolloutSpec {
  knee: Vec2;
  hip0: Vec2;
  hip1: Vec2;
  spine0: number;
  spine1: number;
  bar0: number;
  bar1: number;
  barY: number;
}

/**
 * Kneeling rollout with the knees fixed to the floor or bench. The hips hinge forward from the fixed knees,
 * while the bar center stays at its rolling-surface height. The arms reach the bar with a soft elbow at the start
 * and are nearly straight in the extended position.
 */
export function rolloutPose(p: number, spec: RolloutSpec): Pose {
  const hip: Vec2 = [lerp(spec.hip0[0], spec.hip1[0], p), lerp(spec.hip0[1], spec.hip1[1], p)];
  const spineAngle = lerp(spec.spine0, spec.spine1, p);
  const kneeAngle = ang(sub(spec.knee, hip));
  const grip: Vec2 = [lerp(spec.bar0, spec.bar1, p), spec.barY];
  const wrist: Vec2 = [grip[0], grip[1] - 9];
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

/** Flag transition: the two hands stay on one vertical pole while the body rises from a straight hang to horizontal. */
export function humanFlagPose(p: number): Pose {
  const body = lerp(-90, 0, p);
  const leg = lerp(90, 0, p);
  return {
    hip: [lerp(300, 235, p), 250], spine: { lumbar: body, thoracic: body }, neck: body, head: body,
    farHip: 0, farShoulder: 0,
    legs: {
      near: { a1: leg, a2: leg, foot: lerp(85, 0, p) },
      far: { a1: leg, a2: leg, foot: lerp(85, 0, p) },
    },
    arms: {
      // The upper hand pulls while the lower hand presses. Both grips remain fixed on the pole.
      near: { target: [270, 170], side: [1, 0], hand: 90 },
      far: { target: [270, 260], side: [-1, 0], hand: 90 },
    },
  };
}

/** Ring Maltese hold with a straight horizontal trunk and near-straight arms to two separated rings. */
export function maltesePose(straddle = false): Pose {
  const leg = (far: boolean): LimbSpec => straddle
    ? { a1: far ? 212 : 148, a2: far ? 212 : 148, foot: far ? 212 : 148 }
    : { a1: 180, a2: 180, foot: 180 };
  return {
    hip: [290, 260], spine: { lumbar: 0, thoracic: 0 }, neck: 0, head: 0, farHip: 0, farShoulder: 0,
    legs: { near: leg(false), far: leg(true) },
    arms: {
      near: { target: [280, 300], side: [-1, 0], hand: 180 },
      far: { target: [280, 220], side: [1, 0], hand: 180 },
    },
  };
}
