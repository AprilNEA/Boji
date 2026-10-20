// Flat bench, head at the pad end and feet planted on the floor.
// The bar stays above the chest to behind the head while both elbows keep the same bend.
import type { SideExercise } from '@/exercise.ts';
import { flatPullover } from './_pullover.ts';

export default flatPullover({
  id: 'barbell-bent-arm-pullover',
  name: '杠铃屈臂仰卧上拉',
  meta: {
    en: 'Barbell Bent-Arm Pullover', family: 'pullover', equipment: ['barbell', 'bench'],
    sources: ['fe:Bent-Arm_Barbell_Pullover', 'hz:1316'],
  },
  weight: 'barbell', bent: true,
}) satisfies SideExercise;
