// Hang from the wide handles with the counterweighted knee support below.
// Pull the chin above the handles, then descend without swinging.
import type { FrontExercise } from '@/exercise.ts';
import { frontPullUp } from './_vertical-pull-1.ts';

export default frontPullUp({
  id: 'machine-assisted-pull-up', name: '器械辅助引体向上', en: 'Machine Assisted Pull-Up',
  equipment: ['machine'], sources: ['hz:0017', 'hz:0572'],
}, { assisted: true }) satisfies FrontExercise;
