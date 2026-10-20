// Starts with the upper back supported on a stability ball and the feet planted.
// The elbow reaches about 90 degrees at the bottom, then the loaded dumbbell(s) press nearly straight while the hips remain level.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-single-arm-incline-stability-ball-press', name: '哑铃单臂健身球上斜卧推', en: 'Dumbbell Single-Arm Incline Stability Ball Press',
  sources: ['hz:1282'],
  support: 'ball', implement: 'dumbbell',
  single: true,
  grip: 'end',
}) satisfies SideExercise;
