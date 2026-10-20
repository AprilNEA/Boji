// Decline bench with the feet secured under the roller.
// The nearly straight arms guide the bar in a controlled shoulder arc behind the head.
import type { SideExercise } from '@/exercise.ts';
import { declineBarPullover } from './_pullover.ts';

export default declineBarPullover({
  id: 'barbell-decline-pullover',
  name: '杠铃下斜仰卧上拉',
  meta: {
    en: 'Barbell Decline Pullover', family: 'pullover', equipment: ['barbell', 'bench'],
    sources: ['hz:1255'],
  },
  bent: false,
}) satisfies SideExercise;
