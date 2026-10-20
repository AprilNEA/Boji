// Kneel with both knees fixed on the mat and both hands on the wheel handles.
// Roll the wheel forward to lengthen the arms and torso without losing a neutral back.
// Pull the wheel back to the kneeling setup under abdominal control.
import type { SideExercise } from '@/exercise.ts';
import { workTL } from '@/exercises/equipment/index.ts';
import { abWheel, kneelingWheelRolloutPose } from './_core-stability-2.ts';

const tl = workTL(0.45);

export default {
  id: 'ab-wheel-kneeling-rollout',
  name: '跪姿健腹轮',
  tl,
  mat: true,
  meta: {
    en: 'Ab Wheel Kneeling Rollout', family: 'core-stability', equipment: ['other'],
    sources: ['fe:Ab_Roller', 'hz:0857'],
  },
  muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.46 }, { m: 'lowerBack', scale: 0.3 }],
  dynamic: [abWheel((J) => [J.wrist_n[0], J.wrist_n[1] + 9])],
  propsBox: [160, 470],
  poster: 0.31,
  pose: (t) => kneelingWheelRolloutPose(tl.at(t).p),
} satisfies SideExercise;
