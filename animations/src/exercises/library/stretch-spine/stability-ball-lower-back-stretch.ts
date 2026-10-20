// Start seated on a stability ball with both feet planted on the floor.
// Walk the feet forward and drape the lower back over the ball while supporting the head with the hands.
import type { SideExercise } from '@/exercise.ts';
import { ballLowerBackPose, ballProps, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'stability-ball-lower-back-stretch', name: '健身球腰背拉伸', tl: stretchTL,
  meta: { en: 'Stability Ball Lower Back Stretch', family: 'stretch-spine', equipment: ['stability-ball'], sources: ['hz:1341'] },
  muscles: [{ m: 'lats' }, { m: 'lowerBack', scale: 0.6 }, { m: 'abs', scale: 0.35 }],
  props: ballProps([258, 383]), propsBox: [190, 326], poster: 0.44,
  pose: (t) => ballLowerBackPose(stretchTL.at(t).p),
} satisfies SideExercise;
