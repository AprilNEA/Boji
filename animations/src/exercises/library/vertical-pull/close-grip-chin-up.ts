// Hang with a narrow underhand grip and keep the elbows close to the torso.
// Pull the chin past the bar, then lower fully without swinging.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'close-grip-chin-up', name: '窄握反手引体向上', en: 'Close-Grip Chin-Up', equipment: ['pull-up-bar'],
  sources: ['fe:Chin-Up', 'hz:1327', 'hz:0139'],
}) satisfies SideExercise;
