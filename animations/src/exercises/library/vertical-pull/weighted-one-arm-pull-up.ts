// Hang from one overhand hand with a weight plate suspended from a dip belt and the free arm relaxed.
// Pull until the chin clears the bar, then lower under full control without twisting.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'weighted-one-arm-pull-up', name: '负重单臂引体向上', en: 'Weighted One-Arm Pull-Up',
  equipment: ['pull-up-bar', 'plate'], sources: ['hz:3290'],
}, { oneArm: true, weighted: true }) satisfies SideExercise;
