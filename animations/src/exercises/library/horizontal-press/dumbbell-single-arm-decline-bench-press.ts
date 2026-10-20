// Starts on a decline bench with the ankles secured beneath the rollers and the torso on the pad.
// The elbow bends to about 90 degrees at the lower chest, then the dumbbell(s) press nearly straight without changing the bench contact.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-single-arm-decline-bench-press', name: '哑铃单臂下斜卧推', en: 'Dumbbell Single-Arm Decline Bench Press',
  sources: ['hz:1287'],
  support: 'decline', implement: 'dumbbell',
  single: true,
  grip: 'end',
}) satisfies SideExercise;
