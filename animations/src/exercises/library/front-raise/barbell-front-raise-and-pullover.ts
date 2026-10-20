// Lie supine on a flat bench with a close overhand barbell grip and softly locked elbows.
// Arc the bar from the upper thighs over the chest until it reaches behind the head, then reverse the path.
// The back remains on the bench while both hands keep the shared barbell grip.
import type { SideExercise } from '@/exercise.ts';
import { supineBarbellPullover } from './_front-raise.ts';

export default supineBarbellPullover({
  id: 'barbell-front-raise-and-pullover', name: '杠铃仰卧直臂上拉', en: 'Barbell Front Raise and Pullover',
  sources: ['fe:Front_Raise_And_Pullover', 'hz:0040'],
}) satisfies SideExercise;
