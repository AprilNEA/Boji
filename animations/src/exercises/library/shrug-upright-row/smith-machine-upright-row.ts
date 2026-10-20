// Set the Smith bar at the thighs and stand tall with a shoulder-width overhand grip.
// Keep the bar close as the elbows lead upward toward chin height, then lower it under control.
import type { FrontExercise } from '@/exercise.ts';
import { frontSmithUprightRow } from './_shrug-upright-row.ts';

export default frontSmithUprightRow({
  id: 'smith-machine-upright-row', name: '史密斯直立划船', en: 'Smith Machine Upright Row',
  sources: ['fe:Smith_Machine_Upright_Row'],
}) satisfies FrontExercise;
