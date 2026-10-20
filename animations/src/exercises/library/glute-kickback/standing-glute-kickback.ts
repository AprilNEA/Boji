// Start tall while holding a fixed upright with both hands and both feet beside each other.
// Alternate sides: the hip stays near 175 degrees and the heel curls behind to a 50-degree knee angle.
// The supporting foot stays flat and the torso stays upright instead of arching the lower back.
import type { SideExercise } from '@/exercise.ts';
import { alternate, alternateTL, activeValue, STAND_HIP, standingCurlLegs, supportProps } from './_glute-kickback.ts';

const SUPPORT_X = 335;
const HAND_Y = 225;

export default {
  id: 'standing-glute-kickback',
  name: '站姿腿弯举',
  tl: alternateTL,
  props: supportProps(SUPPORT_X, HAND_Y),
  propsBox: [SUPPORT_X - 32, SUPPORT_X + 32],
  meta: {
    en: 'Standing Glute Kickback',
    family: 'glute-kickback',
    equipment: ['bodyweight', 'other'],
    sources: ['fe:Leg_Lift'],
  },
  muscles: [
    { m: 'hamstrings', side: 'near', e: (t) => activeValue(t, 'near') },
    { m: 'hamstrings', side: 'far', e: (t) => activeValue(t, 'far') },
    { m: 'glutes', scale: 0.35 },
  ],
  pose(t) {
    const { side, p } = alternate(t);
    return {
      hip: STAND_HIP,
      spine: { lumbar: -90, thoracic: -90 },
      neck: -90,
      head: -90,
      farHip: 0,
      farShoulder: 0,
      legs: standingCurlLegs(side, p),
      arms: {
        near: { target: [SUPPORT_X - 17, HAND_Y], side: [1, 0], hand: 90 },
        far: { target: [SUPPORT_X - 17, HAND_Y + 16], side: [1, 0], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
