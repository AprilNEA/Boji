// Only the upper back rests across a short bench; the hips stay below the pad and feet stay planted.
// Both hands cup one dumbbell while the fixed elbow bend follows a shoulder arc behind the head.
import type { SideExercise } from '@/exercise.ts';
import { flatPullover } from './_pullover.ts';

export default flatPullover({
  id: 'dumbbell-bent-arm-pullover',
  name: '哑铃屈臂仰卧上拉',
  meta: {
    en: 'Dumbbell Bent-Arm Pullover', family: 'pullover', equipment: ['dumbbell', 'bench'],
    sources: ['fe:Bent-Arm_Dumbbell_Pullover'],
  },
  weight: 'dumbbell', bent: true, crossBench: true,
}) satisfies SideExercise;
