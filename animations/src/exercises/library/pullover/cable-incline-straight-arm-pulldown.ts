// Reclined on an incline bench facing away from a high pulley.
// Straight arms sweep the bar from above the upper thighs to overhead, then return with the lats.
import type { SideExercise } from '@/exercise.ts';
import { inclineCablePulldown } from './_pullover.ts';

export default inclineCablePulldown(
  'cable-incline-straight-arm-pulldown',
  '绳索上斜直臂下拉',
  {
    en: 'Cable Incline Straight-Arm Pulldown', family: 'pullover', equipment: ['cable', 'bench'],
    sources: ['fe:Cable_Incline_Pushdown', 'hz:0172'],
  },
) satisfies SideExercise;
