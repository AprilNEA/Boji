// Starts on a 45-degree incline bench with the back supported and both feet planted.
// The elbow reaches about 90 degrees at the bottom, then the dumbbell(s) press along the chest normal without lifting the torso.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-incline-bench-press', name: '哑铃上斜卧推', en: 'Dumbbell Incline Bench Press',
  sources: ['fe:Incline_Dumbbell_Press', 'hz:0314', 'hz:0316'],
  support: 'incline', implement: 'dumbbell',
  grip: 'end',
}) satisfies SideExercise;
