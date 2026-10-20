// Hang from the bar with a shoulder-width underhand grip and a quiet, straight body.
// Pull until the chin clears the bar, pause briefly, then lower to straight arms.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'chin-up', name: '反握引体向上', en: 'Chin-Up', equipment: ['pull-up-bar'],
  sources: ['hz:1326', 'hz:0674'],
}) satisfies SideExercise;
