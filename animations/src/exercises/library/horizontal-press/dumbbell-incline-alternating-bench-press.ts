// Starts on a 45-degree incline bench with the back supported and both feet planted.
// The elbow reaches about 90 degrees at the bottom, then the dumbbell(s) press along the chest normal without lifting the torso.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-incline-alternating-bench-press', name: '哑铃上斜交替卧推', en: 'Dumbbell Incline Alternating Bench Press',
  sources: ['hz:3545'],
  support: 'incline', implement: 'dumbbell',
  single: true,
  grip: 'end',
  alternating: true,
}) satisfies SideExercise;
