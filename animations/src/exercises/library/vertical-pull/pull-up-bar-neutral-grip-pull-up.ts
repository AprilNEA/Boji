// Hang with both palms facing each other on parallel handles and the arms fully extended.
// Drive the elbows toward the hips until the chin rises over the handles, then lower under control.
import type { SideExercise } from '@/exercise.ts';
import { pullUp } from './_vertical-pull-2.ts';

export default pullUp({
  id: 'pull-up-bar-neutral-grip-pull-up', name: '对握引体向上', en: 'Pull-Up Bar Neutral-Grip Pull-Up', equipment: ['pull-up-bar'],
  sources: ['hz:0651'],
}, { neutral: true }) satisfies SideExercise;
