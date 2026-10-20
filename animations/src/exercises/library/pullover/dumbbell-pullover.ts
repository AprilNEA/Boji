// Lie on a flat bench with the head at one end and both feet planted on the floor.
// Both hands hold one dumbbell and move it from above the chest to behind the head with a soft elbow bend.
import type { SideExercise } from '@/exercise.ts';
import { flatPullover } from './_pullover.ts';

export default flatPullover({
  id: 'dumbbell-pullover',
  name: '哑铃仰卧上拉',
  meta: {
    en: 'Dumbbell Pullover', family: 'pullover', equipment: ['dumbbell', 'bench'],
    sources: ['hz:0288', 'hz:0375'],
  },
  weight: 'dumbbell', bent: false,
}) satisfies SideExercise;
