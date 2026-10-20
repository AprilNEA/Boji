// Hang from a slightly wide overhand bar with a plate on a dip belt and the body held rigid.
// Pull the chest to the bar, turn over it, and press to a straight-arm support before lowering.
import type { SideExercise } from '@/exercise.ts';
import { barMuscleUp } from './_vertical-pull-2.ts';

export default barMuscleUp({
  id: 'weighted-bar-muscle-up', name: '负重单杠双力臂', en: 'Weighted Bar Muscle-Up',
  equipment: ['pull-up-bar', 'plate'], sources: ['hz:3286', 'hz:3312'],
}, { weighted: true }) satisfies SideExercise;
