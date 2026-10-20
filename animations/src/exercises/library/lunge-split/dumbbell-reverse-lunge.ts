// Begin upright with dumbbells at the sides, then step the rear foot backward into a long lunge.
// Keep the torso tall and the front shin close to vertical as the rear knee lowers toward the floor.
// Drive through the front heel to return to the standing start position.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellLunge } from './_lunge-split-2.ts';

export default dumbbellLunge({
  id: 'dumbbell-reverse-lunge', name: '哑铃后撤弓步蹲', en: 'Dumbbell Reverse Lunge',
  sources: ['fe:Dumbbell_Rear_Lunge'], direction: 'reverse',
}) satisfies SideExercise;
