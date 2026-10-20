// Stand tall with dumbbells at the sides, then step forward into an upright lunge.
// Drive through the front heel back to standing and repeat on the other leg.
// Both dumbbells remain at the sides because both source records specify two dumbbells.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellLunge } from './_lunge-split-2.ts';

export default dumbbellLunge({
  id: 'dumbbell-alternating-forward-lunge', name: '哑铃交替前弓步蹲', en: 'Dumbbell Alternating Forward Lunge',
  sources: ['hz:0336', 'hz:3635'], direction: 'forward', alternate: true,
}) satisfies SideExercise;
