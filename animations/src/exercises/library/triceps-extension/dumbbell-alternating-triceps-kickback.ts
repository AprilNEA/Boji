// Hinge forward with both dumbbells and keep each upper arm beside the torso.
// Extend one elbow backward while the other returns, alternating complete controlled repetitions.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellKickback } from './_triceps-extension-2.ts';

export default dumbbellKickback({
  id: 'dumbbell-alternating-triceps-kickback', name: '哑铃交替俯身臂屈伸', alternating: true,
  meta: { en: 'Dumbbell Alternating Triceps Kickback', family: 'triceps-extension', equipment: ['dumbbell'], sources: ['hz:1739'] },
}) satisfies SideExercise;
