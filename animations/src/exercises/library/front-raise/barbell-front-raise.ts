// Stand tall with feet planted and hold the barbell at the front of the thighs.
// Raise nearly straight arms forward to shoulder level, pause, then lower without swinging the torso.
// The feet and spine stay fixed while both hands retain the shared bar grip.
import type { SideExercise } from '@/exercise.ts';
import { standingFrontRaise } from './_front-raise.ts';

export default standingFrontRaise({
  id: 'barbell-front-raise', name: '杠铃前平举', en: 'Barbell Front Raise',
  sources: ['hz:0041', 'hz:0107'], implement: 'barbell',
}) satisfies SideExercise;
