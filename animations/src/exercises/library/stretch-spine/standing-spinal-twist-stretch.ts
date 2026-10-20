// Stand tall with shoulder-width feet and both hands fixed at the hips.
// Rotate the rib cage and head as one unit while the pelvis and feet remain square.
import type { FrontExercise } from '@/exercise.ts';
import { frontStandingTwistPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'standing-spinal-twist-stretch',
  name: '站姿脊柱转体拉伸',
  view: 'front',
  tl: stretchTL,
  meta: { en: 'Standing Spinal Twist Stretch', family: 'stretch-spine', equipment: ['bodyweight'], sources: ['fe:Middle_Back_Stretch'] },
  muscles: [{ m: 'obliques' }, { m: 'lats', scale: 0.4 }, { m: 'abs', scale: 0.35 }],
  poster: 0.44,
  pose: (t) => frontStandingTwistPose(stretchTL.at(t).p),
} satisfies FrontExercise;
