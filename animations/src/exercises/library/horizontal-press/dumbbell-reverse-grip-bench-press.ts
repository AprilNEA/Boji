// Starts on a flat bench with feet planted and the dumbbell(s) directly over the lower chest.
// The elbows bend to about 90 degrees, then the loaded arm(s) press nearly straight while the bench keeps the torso fixed.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-reverse-grip-bench-press', name: '哑铃反握卧推', en: 'Dumbbell Reverse-Grip Bench Press',
  sources: ['hz:1624'],
  support: 'flat', implement: 'dumbbell',
  grip: 'reverse',
}) satisfies SideExercise;
