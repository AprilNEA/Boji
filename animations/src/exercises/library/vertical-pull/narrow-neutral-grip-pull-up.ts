// Hang from close parallel handles with the palms facing each other and elbows tucked.
// Pull the chin above the handles, pause, then return to the long-arm hang.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'narrow-neutral-grip-pull-up', name: '窄距对握引体向上', en: 'Narrow Neutral-Grip Pull-Up', equipment: ['pull-up-bar'],
  sources: ['hz:0253'],
}, { neutral: true }) satisfies SideExercise;
