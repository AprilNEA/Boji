// Stand straight with a close overhand barbell grip and feet shoulder-width apart.
// Lift the softly bent arms in front through shoulder height until the bar is directly overhead.
// The neutral spine and planted feet stay fixed while both hands keep the bar grip.
import type { SideExercise } from '@/exercise.ts';
import { standingFrontRaise } from './_front-raise.ts';

export default standingFrontRaise({
  id: 'barbell-front-raise-to-overhead', name: '杠铃过顶前平举', en: 'Barbell Front Raise to Overhead',
  sources: ['fe:Standing_Front_Barbell_Raise_Over_Head'], implement: 'barbell', top: -90,
}) satisfies SideExercise;
