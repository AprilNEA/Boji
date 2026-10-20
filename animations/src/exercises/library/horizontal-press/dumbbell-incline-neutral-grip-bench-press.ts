// Starts on a 45-degree incline bench with the back supported and both feet planted.
// The elbow reaches about 90 degrees at the bottom, then the dumbbell(s) press along the chest normal without lifting the torso.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-incline-neutral-grip-bench-press', name: '哑铃上斜对握卧推', en: 'Dumbbell Incline Neutral-Grip Bench Press',
  sources: ['fe:Incline_Dumbbell_Bench_With_Palms_Facing_In', 'hz:0321', 'hz:0324', 'fe:Hammer_Grip_Incline_DB_Bench_Press', 'hz:1623'],
  support: 'incline', implement: 'dumbbell',
  grip: 'profile',
}) satisfies SideExercise;
