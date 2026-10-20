// Hang from a medium overhand grip with a dip belt and plate suspended below the waist.
// Pull the head above the hands with the shoulder blades down and back, then lower to straight arms.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'weighted-pull-up', name: '负重引体向上', en: 'Weighted Pull-Up', equipment: ['pull-up-bar', 'plate'],
  sources: ['fe:Weighted_Pull_Ups', 'hz:0841'],
}, { weighted: true, lean: true }) satisfies SideExercise;
