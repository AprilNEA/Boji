// Decline bench with the ankles locked under the roller.
// The bar travels from over the chest to behind the head without changing the elbow bend.
import type { SideExercise } from '@/exercise.ts';
import { declineBarPullover } from './_pullover.ts';

export default declineBarPullover({
  id: 'barbell-decline-bent-arm-pullover',
  name: '杠铃下斜屈臂上拉',
  meta: {
    en: 'Barbell Decline Bent-Arm Pullover', family: 'pullover', equipment: ['barbell', 'bench'],
    sources: ['hz:0034'],
  },
  bent: true,
}) satisfies SideExercise;
