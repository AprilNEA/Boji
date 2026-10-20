// Starts on a flat bench with feet planted and the dumbbell(s) directly over the lower chest.
// The elbows bend to about 90 degrees, then the loaded arm(s) press nearly straight while the bench keeps the torso fixed.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-neutral-grip-bench-press', name: '哑铃对握卧推', en: 'Dumbbell Neutral-Grip Bench Press',
  sources: ['fe:Dumbbell_Bench_Press_with_Neutral_Grip', 'hz:0340', 'hz:0352'],
  support: 'flat', implement: 'dumbbell',
  grip: 'profile',
}) satisfies SideExercise;
