// Place the hips at the high point of a stability ball with both hands and feet supported on the floor.
// Keep the limbs long while the ball remains beneath the hips and the torso forms the descending side of a pyramid.
import type { SideExercise } from '@/exercise.ts';
import { ballProps, ballPyramidPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'stability-ball-pyramid-stretch', name: '健身球金字塔式拉伸', tl: stretchTL,
  meta: { en: 'Stability Ball Pyramid Stretch', family: 'stretch-spine', equipment: ['stability-ball'], sources: ['fe:Pyramid'] },
  muscles: [{ m: 'lowerBack' }, { m: 'delts', side: 'both', scale: 0.4 }, { m: 'abs', scale: 0.35 }],
  props: ballProps([250, 350]), propsBox: [182, 318], poster: 0.44,
  pose: (t) => ballPyramidPose(stretchTL.at(t).p),
} satisfies SideExercise;
