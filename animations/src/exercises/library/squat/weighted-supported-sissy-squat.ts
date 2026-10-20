// Start upright with raised toes, one hand holding the rack and the other arm securing a plate at the chest.
// Keep the torso almost upright as the knees travel forward, then use the quadriceps to return to the start.
import type { SideExercise } from '@/exercise.ts';
import { supportedSissySquat } from './_squat-3.ts';

export default supportedSissySquat({
  id: 'weighted-supported-sissy-squat', name: '负重扶架西斯深蹲', en: 'Weighted Supported Sissy Squat',
  sources: ['fe:Weighted_Sissy_Squat'],
}) satisfies SideExercise;
