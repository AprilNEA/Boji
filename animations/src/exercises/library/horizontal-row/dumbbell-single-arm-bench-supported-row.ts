// Brace one knee and the same-side hand on a flat bench while holding the dumbbell in the free hand.
// Keep the trunk still and pull the working elbow straight up beside the chest before lowering.
import type { SideExercise } from '@/exercise.ts';
import { benchSupportedRow } from './_horizontal-row-2.ts';

export default benchSupportedRow({
  id: 'dumbbell-single-arm-bench-supported-row', name: '单臂哑铃凳上支撑划船', en: 'Dumbbell Single-Arm Bench-Supported Row',
  equipment: ['dumbbell', 'bench'], sources: ['fe:One-Arm_Dumbbell_Row'],
}) satisfies SideExercise;
