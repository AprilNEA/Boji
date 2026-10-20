// Stand facing away from a low pulley with a neutral spine and arms extended in front of the thighs.
// Raise the low-cable handle with straight arms to shoulder level, pause, then lower under control.
// The torso and planted feet stay fixed while the cable stays connected to the moving handle.
import type { SideExercise } from '@/exercise.ts';
import { standingFrontRaise } from './_front-raise.ts';

export default standingFrontRaise({
  id: 'cable-front-raise', name: '绳索前平举', en: 'Cable Front Raise',
  sources: ['hz:0161', 'hz:0162', 'hz:0164'], implement: 'cable',
}) satisfies SideExercise;
