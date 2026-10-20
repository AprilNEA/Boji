// Use a false grip on the suspended rings, pull the rings to the armpits, and roll the shoulders forward.
// Transition into the ring dip support and extend the elbows before lowering with stability.
import type { SideExercise } from '@/exercise.ts';
import { ringMuscleUp } from './_vertical-pull-2.ts';

export default ringMuscleUp({
  id: 'ring-muscle-up', name: '吊环双力臂', en: 'Ring Muscle-Up', equipment: ['suspension'],
  sources: ['fe:Muscle_Up'],
}) satisfies SideExercise;
