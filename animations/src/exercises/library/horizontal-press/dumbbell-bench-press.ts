// Starts on a flat bench with feet planted and the dumbbell(s) directly over the lower chest.
// The elbows bend to about 90 degrees, then the loaded arm(s) press nearly straight while the bench keeps the torso fixed.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-bench-press', name: '哑铃卧推', en: 'Dumbbell Bench Press',
  sources: ['fe:Dumbbell_Bench_Press', 'hz:0289'],
  support: 'flat', implement: 'dumbbell',
  grip: 'end',
}) satisfies SideExercise;
