// Stand upright with the resistance band anchored under the planted feet and palms facing down.
// Keep both arms nearly straight as the hands rise in front to shoulder height, then lower slowly.
// The feet, torso and band anchors remain fixed throughout the controlled repetition.
import type { SideExercise } from '@/exercise.ts';
import { standingFrontRaise } from './_front-raise.ts';

export default standingFrontRaise({
  id: 'band-front-raise', name: '弹力带前平举', en: 'Band Front Raise',
  sources: ['hz:0977', 'hz:0978'], implement: 'band',
}) satisfies SideExercise;
