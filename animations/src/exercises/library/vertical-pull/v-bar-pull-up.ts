// Suspend a V handle from the pull-up bar and hold its two neutral grips with the chest lifted.
// Pull the chest near the V handle, then lower to the controlled bent-knee hang.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'v-bar-pull-up', name: 'V把对握引体向上', en: 'V-Bar Pull-Up', equipment: ['pull-up-bar'],
  sources: ['fe:V-Bar_Pullup'],
}, { vBar: true }) satisfies SideExercise;
