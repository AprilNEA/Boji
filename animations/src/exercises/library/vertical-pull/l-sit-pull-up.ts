// Hold straight legs horizontal while hanging with an overhand grip.
// Pull the chin over the bar without lowering the legs, then return to straight arms.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'l-sit-pull-up', name: '直角引体向上', en: 'L-Sit Pull-Up', equipment: ['pull-up-bar'],
  sources: ['hz:3418'],
}, { lSit: true }) satisfies SideExercise;
