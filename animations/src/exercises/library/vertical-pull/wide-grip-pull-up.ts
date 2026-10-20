// Hang from a wide overhand grip with the arms fully extended and the core braced.
// Pull the body up until the chin clears the bar, then lower smoothly without swinging.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'wide-grip-pull-up', name: '宽握引体向上', en: 'Wide-Grip Pull-Up', equipment: ['pull-up-bar'],
  sources: ['hz:1429'],
}) satisfies SideExercise;
