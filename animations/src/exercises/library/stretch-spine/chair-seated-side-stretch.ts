// Sit upright on a chair with the feet planted and the outside hand holding the seat.
// Keep the chair contact fixed while the other hand rests behind the head during the lateral bend.
import type { FrontExercise } from '@/exercise.ts';
import { frontChairProps, frontChairSideBendPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'chair-seated-side-stretch',
  name: '坐椅侧屈拉伸',
  view: 'front',
  tl: stretchTL,
  meta: { en: 'Chair Seated Side Stretch', family: 'stretch-spine', equipment: ['chair'], sources: ['fe:Chair_Lower_Back_Stretch'] },
  muscles: [{ m: 'lats' }, { m: 'obliques', scale: 0.5 }],
  props: frontChairProps,
  propsBox: [-97, 97],
  poster: 0.44,
  pose: (t) => frontChairSideBendPose(stretchTL.at(t).p),
} satisfies FrontExercise;
