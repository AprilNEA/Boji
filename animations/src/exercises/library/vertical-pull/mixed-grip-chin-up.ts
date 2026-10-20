// Hang from a slightly wide mixed grip, with one palm up and the other palm down.
// Pull the chest upward until the chin clears the bar, then lower with control.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'mixed-grip-chin-up', name: '正反握引体向上', en: 'Mixed-Grip Chin-Up', equipment: ['pull-up-bar'],
  sources: ['hz:0627', 'fe:Mixed_Grip_Chin'],
}) satisfies SideExercise;
