// Stand under the calf-machine shoulder pads with the feet planted and arms relaxed.
// Lift only the shoulders into the pads while the heels remain on the floor.
import type { FrontExercise } from '@/exercise.ts';
import { frontMachineStandingShrug } from './_shrug-upright-row.ts';

export default frontMachineStandingShrug({
  id: 'machine-calf-raise-shoulder-shrug', name: '提踵机耸肩', en: 'Machine Calf Raise Shoulder Shrug',
  sources: ['fe:Calf-Machine_Shoulder_Shrug'],
}) satisfies FrontExercise;
