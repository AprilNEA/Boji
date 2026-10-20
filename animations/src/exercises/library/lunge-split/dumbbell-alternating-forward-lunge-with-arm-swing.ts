// Start standing with a dumbbell in each hand, then step forward into an upright alternating lunge.
// During each descent, swing the straight arms forward and upward with the dumbbells.
// Return the weights to the sides as the lead foot pushes back to the standing position.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellLunge } from './_lunge-split-2.ts';

export default dumbbellLunge({
  id: 'dumbbell-alternating-forward-lunge-with-arm-swing', name: '哑铃交替前弓步摆臂',
  en: 'Dumbbell Alternating Forward Lunge with Arm Swing', sources: ['hz:3644'],
  direction: 'forward', alternate: true, arm: 'swing',
}) satisfies SideExercise;
