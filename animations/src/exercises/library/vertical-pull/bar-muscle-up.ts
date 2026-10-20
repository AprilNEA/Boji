// Hang from an overhand bar, pull the chest through the bar, and turn the shoulders over it.
// Finish in a straight-arm support, then lower through the same controlled transition.
import type { SideExercise } from '@/exercise.ts';
import { barMuscleUp } from './_vertical-pull-2.ts';

export default barMuscleUp({
  id: 'bar-muscle-up', name: '单杠双力臂', en: 'Bar Muscle-Up', equipment: ['pull-up-bar'],
  sources: ['hz:0631'],
}) satisfies SideExercise;
