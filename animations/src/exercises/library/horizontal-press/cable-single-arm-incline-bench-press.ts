// Starts with the back supported by a 45-degree incline bench and the feet planted.
// The cable handle moves forward along the chest normal as the elbow extends, then returns under control.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'cable-single-arm-incline-bench-press', name: '绳索单臂上斜卧推', en: 'Cable Single-Arm Incline Bench Press',
  sources: ['hz:1265'],
  support: 'incline', implement: 'cable',
  single: true,
  cableHeight: 'low',
}) satisfies SideExercise;
