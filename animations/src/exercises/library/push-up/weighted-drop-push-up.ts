// Start in a straight high plank while wearing a fitted weighted vest and keeping the feet planted.
// Explosively leave the floor, move the hands between close and wide positions, and absorb each landing softly.
import type { SideExercise } from '@/exercise.ts';
import { plyoPush, weightedVest } from './_push-up-2.ts';

export default plyoPush({
  id: 'weighted-drop-push-up', name: '负重下落式俯卧撑', en: 'Weighted Drop Push-Up',
  equipment: ['bodyweight', 'other'], sources: ['hz:1310'], dynamic: weightedVest,
}) satisfies SideExercise;
