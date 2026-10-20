// Flat bench, with the head at one end and the feet planted under bent knees.
// Straight arms lower the bar behind the head and reverse the same shoulder arc over the chest.
import type { SideExercise } from '@/exercise.ts';
import { flatPullover } from './_pullover.ts';

export default flatPullover({
  id: 'barbell-pullover',
  name: '杠铃仰卧直臂上拉',
  meta: {
    en: 'Barbell Pullover', family: 'pullover', equipment: ['barbell', 'bench'],
    sources: ['hz:0073'],
  },
  weight: 'barbell', bent: false,
}) satisfies SideExercise;
