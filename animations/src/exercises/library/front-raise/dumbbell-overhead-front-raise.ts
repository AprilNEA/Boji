// Stand tall with dumbbells in front of the thighs and a quiet, neutral torso.
// Raise both nearly straight arms in a semicircle forward until the weights are overhead, then lower them.
// The feet remain flat and each dumbbell stays connected to the hand that lifts it.
import type { SideExercise } from '@/exercise.ts';
import { standingFrontRaise } from './_front-raise.ts';

export default standingFrontRaise({
  id: 'dumbbell-overhead-front-raise', name: '哑铃过顶前平举', en: 'Dumbbell Overhead Front Raise',
  sources: ['fe:Standing_Dumbbell_Straight-Arm_Front_Delt_Raise_Above_Head', 'hz:0419'],
  implement: 'dumbbell', top: -90,
}) satisfies SideExercise;
