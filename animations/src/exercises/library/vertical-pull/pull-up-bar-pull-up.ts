// The covered sources all prescribe a shoulder-width overhand hang with a quiet, straight body.
// Pull the chest toward the bar until the chin clears, then return to full arm extension.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'pull-up-bar-pull-up', name: '正手引体向上', en: 'Pull-Up Bar Pull-Up', equipment: ['pull-up-bar'],
  sources: ['hz:0140', 'hz:0652', 'hz:0670', 'hz:1763', 'hz:0678', 'hz:0467'],
}) satisfies SideExercise;
