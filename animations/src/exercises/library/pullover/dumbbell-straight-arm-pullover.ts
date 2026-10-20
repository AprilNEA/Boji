// Only the shoulders cross a short bench while the lowered hips and planted feet stay fixed.
// Both hands hold one dumbbell in nearly straight arms and move it in a controlled arc behind the head.
import type { SideExercise } from '@/exercise.ts';
import { flatPullover } from './_pullover.ts';

export default flatPullover({
  id: 'dumbbell-straight-arm-pullover',
  name: '哑铃直臂仰卧上拉',
  meta: {
    en: 'Dumbbell Straight-Arm Pullover', family: 'pullover', equipment: ['dumbbell', 'bench'],
    sources: ['fe:Straight-Arm_Dumbbell_Pullover', 'hz:0433'],
  },
  weight: 'dumbbell', bent: false, crossBench: true,
}) satisfies SideExercise;
