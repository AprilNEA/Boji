// Stand tall with dumbbells at the sides and step one foot backward into an upright lunge.
// Keep the front shin near vertical and push through the front heel to stand again.
// The loop repeats the same controlled rear step with the opposite leg.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellLunge } from './_lunge-split-2.ts';

export default dumbbellLunge({
  id: 'dumbbell-alternating-reverse-lunge', name: '哑铃交替后撤箭步蹲', en: 'Dumbbell Alternating Reverse Lunge',
  sources: ['hz:0381'], direction: 'reverse', alternate: true,
}) satisfies SideExercise;
