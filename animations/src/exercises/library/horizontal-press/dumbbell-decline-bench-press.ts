// Starts on a decline bench with the ankles secured beneath the rollers and the torso on the pad.
// The elbow bends to about 90 degrees at the lower chest, then the dumbbell(s) press nearly straight without changing the bench contact.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-decline-bench-press', name: '哑铃下斜卧推', en: 'Dumbbell Decline Bench Press',
  sources: ['fe:Decline_Dumbbell_Bench_Press', 'hz:0301'],
  support: 'decline', implement: 'dumbbell',
  grip: 'end',
}) satisfies SideExercise;
