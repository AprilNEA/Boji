// Begin with the dumbbells at the sides and step the lead foot forward into an upright lunge.
// Curl both weights toward the shoulders as the knees lower to about right angles.
// Push through the lead heel while lowering the weights back to the sides.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellLunge } from './_lunge-split-2.ts';

export default dumbbellLunge({
  id: 'dumbbell-forward-lunge-with-biceps-curl', name: '哑铃前弓步蹲加弯举',
  en: 'Dumbbell Forward Lunge with Biceps Curl', sources: ['hz:1658'], direction: 'forward', arm: 'curl',
}) satisfies SideExercise;
