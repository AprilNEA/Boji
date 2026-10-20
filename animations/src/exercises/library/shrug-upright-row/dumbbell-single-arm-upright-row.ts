// Begin with one dumbbell at the thigh while the other arm hangs relaxed.
// Pull one elbow outward and upward to raise the dumbbell toward the chin, then show the same repetition on the other side.
import type { FrontExercise } from '@/exercise.ts';
import { frontSingleDumbbellUprightRow } from './_shrug-upright-row.ts';

export default frontSingleDumbbellUprightRow({
  id: 'dumbbell-single-arm-upright-row', name: '哑铃单臂直立划船', en: 'Dumbbell Single-Arm Upright Row',
  sources: ['fe:Dumbbell_One-Arm_Upright_Row', 'hz:0363'],
}) satisfies FrontExercise;
