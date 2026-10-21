// Private front-view pose utilities for the hip-abduction-adduction family.
// These keep the torso quiet while the legs move in the frontal plane.
import type { FLimbSpec, FrontPose } from '@/rig/front.ts';
import { add3, type Vec3 } from '@/math/vec3.ts';
import { BODY } from '@/rig/side.ts';

// This height gives a standing foot a knee angle of about 175° rather than a squat.
export const STAND_PELVIS: Vec3 = [0, BODY.ankleH + 183.5, 0];

/** An upright, square standing pose with both hands resting at the hips. */
export function standingPose(legs: FrontPose['legs'], pelvis: Vec3 = STAND_PELVIS): FrontPose {
  return {
    pelvis,
    legs,
    arms: {
      l: { target: (J) => add3(J.hip_l, [32, 17, 23]) },
      r: { target: (J) => add3(J.hip_r, [-32, 17, 23]) },
    },
  };
}

/** Bent-knee seated pose. Thighs extend forward in depth and feet stay on the floor. */
export function seatedPose(legs: FrontPose['legs']): FrontPose {
  return {
    pelvis: [0, 115, 0],
    legs,
    arms: {
      l: { target: [76, 122, 18] },
      r: { target: [-76, 122, 18] },
    },
  };
}

/** A straight leg target on the floor with the foot facing forward. */
export const groundedLeg = (x: number, z = 4): FLimbSpec => ({ target: [x, BODY.ankleH, z] });
