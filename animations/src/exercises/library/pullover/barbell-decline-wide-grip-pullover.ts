// Decline bench with the feet secured under the roller.
// A wide, straight grip makes the bar arc only at the shoulder joints from chest to behind the head.
import type { SideExercise } from '@/exercise.ts';
import { declineBarPullover } from './_pullover.ts';

export default declineBarPullover({
  id: 'barbell-decline-wide-grip-pullover',
  name: '杠铃下斜宽握上拉',
  meta: {
    en: 'Barbell Decline Wide-Grip Pullover', family: 'pullover', equipment: ['barbell', 'bench'],
    sources: ['hz:0037'],
  },
  bent: false,
  wide: true,
}) satisfies SideExercise;
