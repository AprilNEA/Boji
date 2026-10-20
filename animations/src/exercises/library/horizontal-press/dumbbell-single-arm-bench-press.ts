// Starts on a flat bench with feet planted and the dumbbell(s) directly over the lower chest.
// The elbows bend to about 90 degrees, then the loaded arm(s) press nearly straight while the bench keeps the torso fixed.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-single-arm-bench-press', name: '哑铃单臂卧推', en: 'Dumbbell Single-Arm Bench Press',
  sources: ['hz:0343', 'hz:0342', 'fe:One_Arm_Dumbbell_Bench_Press'],
  support: 'flat', implement: 'dumbbell',
  single: true,
  grip: 'end',
}) satisfies SideExercise;
