// Starts on a 45-degree incline bench with the back supported and both feet planted.
// The elbow reaches about 90 degrees at the bottom, then the dumbbell(s) press along the chest normal without lifting the torso.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-single-arm-incline-bench-press', name: '哑铃单臂上斜卧推', en: 'Dumbbell Single-Arm Incline Bench Press',
  sources: ['hz:1281', 'hz:1289'],
  support: 'incline', implement: 'dumbbell',
  single: true,
  grip: 'end',
}) satisfies SideExercise;
