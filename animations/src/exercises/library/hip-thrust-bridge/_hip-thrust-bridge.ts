// Shared side-view poses for supine bridges and upper-back-supported hip thrusts.
// The planted feet use fixed floor targets. The bridge neck base or thrust upper back stays at its support point.
import type { Joints, LimbPair, Pose } from '@/rig/side.ts';
import { add, dir, lerp, mul, type Vec2 } from '@/math/vec2.ts';
import { A, FLOOR } from '@/exercises/common.ts';
import { workTL } from '@/exercises/equipment/index.ts';

export const bridgeTL = () => workTL(0.5);

const BRIDGE_N: Vec2 = [150, FLOOR - 18];
const BRIDGE_R = 123.7;
const BRIDGE_REST = -3.8;
const bridgeRestHip = add(BRIDGE_N, mul(dir(BRIDGE_REST), BRIDGE_R));
// At the top, this gives a 179° hip and a 93° supporting knee.
// A higher arc makes the thigh point down instead of reaching hip extension.
const BRIDGE_TOP: Vec2 = [254, 385];
export const BRIDGE_ANKLE: Vec2 = [bridgeRestHip[0] + 106, FLOOR - A];

export const bridgeHip = (p: number): Vec2 => [
  lerp(bridgeRestHip[0], BRIDGE_TOP[0], p),
  lerp(bridgeRestHip[1], BRIDGE_TOP[1], p),
];

export const plantedBridgeLegs = (): LimbPair => ({
  near: { target: BRIDGE_ANKLE, foot: 0, side: [0, -1] },
  far: { target: add(BRIDGE_ANKLE, [-5, 0]), foot: 0, side: [0, -1] },
});

export const bridgeArms: LimbPair = {
  near: { a1: 8, a2: 1, hand: 0 },
  far: { a1: 7, a2: 0, hand: 0 },
};

export function bridgePose(p: number, legs: LimbPair = plantedBridgeLegs(), arms: LimbPair = bridgeArms): Pose {
  return {
    hip: bridgeHip(p),
    spine: { target: BRIDGE_N, side: [0, 1] },
    neck: 182, head: 181,
    legs, arms,
  };
}

export const THRUST_N: Vec2 = [170, 362];
// Leave a small reach margin so the torso IK never locks out at either end.
const THRUST_R = 123.6;
const THRUST_REST = 28;
const THRUST_TOP = -8;
const thrustRestHip = add(THRUST_N, mul(dir(THRUST_REST), THRUST_R));
export const THRUST_ANKLE: Vec2 = [386, FLOOR - A];

export const thrustHip = (p: number): Vec2 => add(THRUST_N, mul(dir(lerp(THRUST_REST, THRUST_TOP, p)), THRUST_R));

export const plantedThrustLegs = (): LimbPair => ({
  near: { target: THRUST_ANKLE, foot: 0, side: [0, -1] },
  far: { target: add(THRUST_ANKLE, [-5, 0]), foot: 0, side: [0, -1] },
});

export const hipBar = (J: Joints): Vec2 => add(J.H, [2, -8]);

export const barHoldArms: LimbPair = {
  near: { target: (J) => add(hipBar(J), [-9, 0]), side: [0, -1], hand: 0 },
  far: { target: (J) => add(hipBar(J), [-12, 1]), side: [0, -1], hand: 0 },
};

export const benchSupportArms: LimbPair = {
  // Hands grip the bench-side rail behind the torso instead of hanging through the floor.
  near: { target: [132, 382], side: [0, 1], hand: 180 },
  far: { target: [129, 385], side: [0, 1], hand: 180 },
};

export const ballSupportArms: LimbPair = {
  // The hands rest beside the hips, clear of the ball behind the upper back.
  near: { target: [280, 430], side: [0, 1], hand: 0 },
  far: { target: [276, 432], side: [0, 1], hand: 0 },
};

export function hipThrustPose(p: number, arms: LimbPair = benchSupportArms): Pose {
  return {
    hip: thrustHip(p),
    spine: { target: THRUST_N, side: [0, 1] },
    neck: 176, head: 176,
    legs: plantedThrustLegs(), arms,
  };
}
