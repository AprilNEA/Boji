// Start seated behind the preacher pad with both upper arms resting on its top surface.
// Curl both dumbbells toward the shoulders and lower them, while the chest and upper arms stay supported.
import type { SideExercise } from '@/exercise.ts';
import { preacherDumbbell } from './_biceps-curl-5.ts';

export default preacherDumbbell({
  id: 'dumbbell-two-arm-preacher-curl', name: '哑铃双臂牧师凳弯举', en: 'Dumbbell Two-Arm Preacher Curl',
  equipment: ['dumbbell', 'bench'], sources: ['fe:Two-Arm_Dumbbell_Preacher_Curl'],
}) satisfies SideExercise;
