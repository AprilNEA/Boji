// Starts with the upper back on a stability ball, hips level and both feet planted.
// The dumbbells lower until the elbows reach about 90 degrees, then press nearly straight while the ball and torso stay still.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-chest-press-on-stability-ball', name: '健身球哑铃卧推', en: 'Dumbbell Chest Press on Stability Ball',
  sources: ['hz:1293'],
  support: 'ball', implement: 'dumbbell',
  grip: 'end',
}) satisfies SideExercise;
