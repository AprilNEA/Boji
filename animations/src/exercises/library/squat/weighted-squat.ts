// Hold a plate in front of the chest with both hands, with the heels flat at shoulder-width stance.
// Sit the hips down and back to parallel, then drive through the heels and finish with straight hips and knees.
import type { SideExercise } from '@/exercise.ts';
import { weightedSquat } from './_squat-3.ts';

export default weightedSquat({
  id: 'weighted-squat', name: '负重深蹲', en: 'Weighted Squat',
  sources: ['hz:0852', 'hz:0851'],
}) satisfies SideExercise;
