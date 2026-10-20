// Hang from the close parallel handles with the counterweight support beneath the knees.
// Pull the chin above the handles while keeping the elbows close to the torso.
import type { SideExercise } from '@/exercise.ts';
import { sidePullUp } from './_vertical-pull-1.ts';

export default sidePullUp({
  id: 'machine-assisted-close-neutral-grip-pull-up', name: '器械辅助窄距对握引体向上', en: 'Machine Assisted Close Neutral-Grip Pull-Up',
  equipment: ['machine'], sources: ['hz:0015'],
}, { assisted: true, neutral: true }) satisfies SideExercise;
