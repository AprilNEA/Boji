// Begin upright with two dumbbells by the sides, then step the lead foot forward.
// Descend with an upright chest until both knees form about right angles.
// The front shin stays near vertical as the lead heel returns the body to standing.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellLunge } from './_lunge-split-2.ts';

export default dumbbellLunge({
  id: 'dumbbell-forward-lunge', name: '哑铃前弓步蹲', en: 'Dumbbell Forward Lunge',
  sources: ['fe:Dumbbell_Lunges'], direction: 'forward',
}) satisfies SideExercise;
