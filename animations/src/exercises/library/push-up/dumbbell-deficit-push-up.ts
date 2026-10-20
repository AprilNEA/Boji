// Grip stable dumbbells from a straight high plank so the chest can travel below hand level.
// Keep the body braced as the elbows bend deeply, then press through the dumbbell handles to the start.
import type { SideExercise } from '@/exercise.ts';
import { floorDumbbells, floorPush } from './_push-up-2.ts';

export default floorPush({
  id: 'dumbbell-deficit-push-up', name: '哑铃支撑加深俯卧撑', en: 'Dumbbell Deficit Push-Up',
  equipment: ['bodyweight', 'dumbbell'], sources: ['hz:1274'], dynamic: floorDumbbells(),
}) satisfies SideExercise;
