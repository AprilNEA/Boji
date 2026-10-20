// Starts with the back supported by a 45-degree incline bench and the feet planted.
// The cable handle moves forward along the chest normal as the elbow extends, then returns under control.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'cable-incline-bench-press', name: '绳索上斜卧推', en: 'Cable Incline Bench Press',
  sources: ['hz:0169'],
  support: 'incline', implement: 'cable',
  cableHeight: 'high',
}) satisfies SideExercise;
