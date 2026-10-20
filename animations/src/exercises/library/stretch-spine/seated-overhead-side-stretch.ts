// Sit on the mat with both feet forward and one hand braced beside the hips.
// Keep the bracing hand fixed while the other hand stays behind the head during the side bend.
import type { FrontExercise } from '@/exercise.ts';
import { frontSeatedSideBendPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'seated-overhead-side-stretch',
  name: '坐姿侧屈拉伸',
  view: 'front',
  tl: stretchTL,
  mat: true,
  meta: { en: 'Seated Overhead Side Stretch', family: 'stretch-spine', equipment: ['bodyweight'], sources: ['fe:Seated_Overhead_Stretch'] },
  muscles: [{ m: 'obliques' }, { m: 'abs', scale: 0.45 }],
  poster: 0.44,
  pose: (t) => frontSeatedSideBendPose(stretchTL.at(t).p),
} satisfies FrontExercise;
