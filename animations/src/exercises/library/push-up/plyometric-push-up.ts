// Start in a straight high plank with hands below the shoulders and toes on the mat.
// Lower the chest with controlled elbows, then press fast enough for both hands to clear the floor.
import type { SideExercise } from '@/exercise.ts';
import { plyoPush } from './_push-up-2.ts';

export default plyoPush({
  id: 'plyometric-push-up', name: '爆发式俯卧撑', en: 'Plyometric Push-Up',
  equipment: ['bodyweight'], sources: ['fe:Plyo_Push-up', 'hz:1306'],
}) satisfies SideExercise;
