// Start standing tall with a plate held at its upper edges in a pronated grip near the groin.
// Curl the plate upward while the elbows stay in and the upper arms and torso remain still.
import type { SideExercise } from '@/exercise.ts';
import { plateCurl } from './_biceps-curl-5.ts';

export default plateCurl({
  id: 'weight-plate-reverse-curl', name: '杠铃片反握弯举', en: 'Weight Plate Reverse Curl',
  equipment: ['plate'], sources: ['fe:Reverse_Plate_Curls'],
}) satisfies SideExercise;
