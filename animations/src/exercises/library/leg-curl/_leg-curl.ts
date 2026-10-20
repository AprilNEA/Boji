// Shared side-view geometry for the leg-curl family.
// The prone variations keep the hips and chest on a flat bench while only the knees flex.
import { lerp, type Vec2 } from '@/math.ts';
import type { Pose } from '@/rig.ts';
import { G } from '@/exercises/common.ts';
import { flatBench, workTL } from '@/exercises/equipment/index.ts';

/** Normal curl cadence: one-second curl, brief squeeze, and slow return. */
export const curlTL = workTL(0.4);
/** Absolute shin angle. 180° is straight behind the hip; 290° gives a 70° knee angle. */
export const curlAngle = (t: number): number => lerp(180, 290, curlTL.at(t).p);

/** Flat bench and body placement used by prone curl variations. */
export const PRONE = {
  hip: [250, G - 160] as Vec2,
  bench: flatBench({ view: 'side', x: 255, top: 130, length: 285 }),
  /** The knee remains just behind the bench edge. */
  knee: [156, G - 160] as Vec2,
  handle: [388, G - 132] as Vec2,
};

/** Prone curl with the hips fixed on the bench and hands holding its front handles. */
export function proneCurlPose(shin: number): Pose {
  return {
    hip: PRONE.hip,
    spine: { lumbar: 0, thoracic: 0 },
    neck: 0,
    head: 0,
    legs: {
      near: { a1: 180, a2: shin, foot: 0 },
      far: { a1: 180, a2: shin - 2, foot: 0 },
    },
    arms: {
      near: { target: PRONE.handle, side: [1, 0.6], hand: 0 },
      far: { target: [PRONE.handle[0] - 4, PRONE.handle[1] + 2], side: [1, 0.6], hand: 0 },
    },
  };
}

/** Hip, chest, and knees for a high bridge with heels sliding toward the body. */
export const BRIDGE = {
  neck: [132, G - 23] as Vec2,
  hip: [250, G - 108] as Vec2,
  ankleLow: [406, G - 13] as Vec2,
  ankleHigh: [313, G - 13] as Vec2,
};
