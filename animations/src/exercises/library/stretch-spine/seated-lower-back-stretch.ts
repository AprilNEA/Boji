// Sit at the front of a chair with both feet flat and the hands supported on the thighs.
// Hinge forward from the hips with a long back, then return without moving the feet or seat contact.
import type { SideExercise } from '@/exercise.ts';
import { chairForwardFoldPose, sideChairProps, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'seated-lower-back-stretch', name: '坐姿下背部拉伸', tl: stretchTL,
  meta: { en: 'Seated Lower Back Stretch', family: 'stretch-spine', equipment: ['chair'], sources: ['hz:0690'] },
  muscles: [{ m: 'lowerBack' }, { m: 'lats', scale: 0.45 }, { m: 'hamstrings', side: 'both', scale: 0.3 }],
  props: sideChairProps, propsBox: [190, 310], poster: 0.44,
  pose: (t) => chairForwardFoldPose(stretchTL.at(t).p),
} satisfies SideExercise;
