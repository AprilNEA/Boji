// Start below an overhand bar and use a controlled forward swing to initiate the pull.
// Pull the chest to the bar, transition above it, then press the elbows straight before lowering.
import type { SideExercise } from '@/exercise.ts';
import { barMuscleUp } from './_vertical-pull-2.ts';

export default barMuscleUp({
  id: 'kipping-muscle-up', name: '借力双力臂', en: 'Kipping Muscle-Up', equipment: ['pull-up-bar'],
  sources: ['hz:0558'],
}, { kipping: true }) satisfies SideExercise;
