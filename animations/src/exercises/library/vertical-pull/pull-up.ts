// Start on a medium overhand grip with the chest up and the torso leaned back about 30 degrees.
// Draw the shoulders down and back until the upper chest meets the bar, then lower smoothly.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'pull-up', name: '引体向上', en: 'Pull-Up', equipment: ['pull-up-bar'],
  sources: ['fe:Pullups'],
}, { lean: true }) satisfies SideExercise;
