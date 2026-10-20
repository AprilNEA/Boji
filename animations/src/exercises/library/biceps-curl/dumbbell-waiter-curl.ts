// Start standing tall with both palms under one upright dumbbell and the elbows close to the torso.
// Curl the dumbbell to shoulder height, while the torso, upper arms, and feet remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { waiterCurl } from './_biceps-curl-5.ts';

export default waiterCurl({
  id: 'dumbbell-waiter-curl', name: '站姿哑铃弯举', en: 'Dumbbell Waiter Curl',
  equipment: ['dumbbell'], sources: ['hz:5201'],
}) satisfies SideExercise;
