// Begin upright while holding the wheel, then hinge forward as it reaches the mat.
// Roll from the feet into a long wheel-supported plank with the abdomen braced.
// Reverse the path back to standing without rounding or sagging through the lower back.
import type { SideExercise } from '@/exercise.ts';
import { workTL } from '@/exercises/equipment/index.ts';
import { abWheel, standingWheelRolloutPose } from './_core-stability-2.ts';

const tl = workTL(0.45);

export default {
  id: 'ab-wheel-standing-rollout',
  name: '站姿健腹轮',
  tl,
  mat: true,
  meta: {
    en: 'Ab Wheel Standing Rollout', family: 'core-stability', equipment: ['other'],
    sources: ['hz:0796', 'hz:3637'],
  },
  muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.48 }, { m: 'lowerBack', scale: 0.32 }],
  dynamic: [abWheel((J) => [J.wrist_n[0], J.wrist_n[1] + 9])],
  propsBox: [120, 480],
  poster: 0.31,
  pose: (t) => standingWheelRolloutPose(tl.at(t).p),
} satisfies SideExercise;
