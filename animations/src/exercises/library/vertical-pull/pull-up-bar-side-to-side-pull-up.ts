// Hang from the bar with both arms extended and the trunk stable.
// Pull the chin toward one hand, lower, and repeat toward the other hand.
import type { FrontExercise } from '@/exercise.ts';
import { frontPullUp } from './_vertical-pull-1.ts';

export default frontPullUp({
  id: 'pull-up-bar-side-to-side-pull-up', name: '单杠左右交替引体向上', en: 'Pull-Up Bar Side-to-Side Pull-Up',
  equipment: ['pull-up-bar'], sources: ['hz:0720'],
}, { alternate: true }) satisfies FrontExercise;
