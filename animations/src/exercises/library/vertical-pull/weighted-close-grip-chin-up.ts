// Hang from close underhand handles with a dip belt and weight plate hanging below the waist.
// Pull the chin above the handles while keeping the legs quiet, then lower to straight arms.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'weighted-close-grip-chin-up', name: '负重窄握反手引体', en: 'Weighted Close-Grip Chin-Up',
  equipment: ['pull-up-bar', 'plate'], sources: ['hz:2987'],
}, { weighted: true }) satisfies SideExercise;
