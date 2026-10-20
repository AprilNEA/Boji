// Starts on a 45-degree incline bench with the back supported and both feet planted.
// The elbow reaches about 90 degrees at the bottom, then the dumbbell(s) press along the chest normal without lifting the torso.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-single-arm-incline-neutral-grip-bench-press', name: '哑铃单臂上斜对握卧推', en: 'Dumbbell Single-Arm Incline Neutral-Grip Bench Press',
  sources: ['hz:1619'],
  support: 'incline', implement: 'dumbbell',
  single: true,
  grip: 'profile',
  tricepsPrimary: true,
}) satisfies SideExercise;
