// Hang from a wide overhand grip with the body quiet below the bar.
// Shift toward the bending arm while the opposite arm stays long, then alternate.
import type { FrontExercise } from '@/exercise.ts';
import { frontPullUp } from './_vertical-pull-1.ts';

export default frontPullUp({
  id: 'archer-pull-up', name: '弓箭手引体向上', en: 'Archer Pull-Up',
  equipment: ['pull-up-bar'], sources: ['hz:3293'],
}, { archer: true, wide: true }) satisfies FrontExercise;
