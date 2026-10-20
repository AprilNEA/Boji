// Start beside the Smith bar with one arm extended and the off hand removed from the bar.
// Raise the working upper arm outward only until it is parallel to the floor, then return and repeat on the other side.
import type { FrontExercise } from '@/exercise.ts';
import { frontSingleSmithUprightRow } from './_shrug-upright-row.ts';

export default frontSingleSmithUprightRow({
  id: 'smith-machine-single-arm-upright-row', name: '史密斯单臂直立划船', en: 'Smith Machine Single-Arm Upright Row',
  sources: ['fe:Smith_Machine_One-Arm_Upright_Row'],
}) satisfies FrontExercise;
