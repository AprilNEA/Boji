// Starts supine on the floor with knees bent and the upper arms able to touch the floor.
// The dumbbells pause at the floor-limited bottom, then press nearly straight without shifting the torso.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'dumbbell-floor-press', name: '哑铃地板卧推', en: 'Dumbbell Floor Press',
  sources: ['fe:Dumbbell_Floor_Press'],
  support: 'floor', implement: 'dumbbell',
  grip: 'end',
  tricepsPrimary: true,
}) satisfies SideExercise;
