// Starts on a decline bench with the ankles secured beneath the rollers and the torso on the pad.
// The elbow bends to about 90 degrees at the lower chest, then the dumbbell(s) press nearly straight without changing the bench contact.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-decline-single-arm-neutral-grip-bench-press', name: '哑铃下斜单臂对握卧推', en: 'Dumbbell Decline Single-Arm Neutral-Grip Bench Press',
  sources: ['hz:1617'],
  support: 'decline', implement: 'dumbbell',
  single: true,
  grip: 'profile',
  tricepsPrimary: true,
}) satisfies SideExercise;
