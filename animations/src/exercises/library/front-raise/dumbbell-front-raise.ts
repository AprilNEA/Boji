// Stand tall with dumbbells in front of the thighs and keep the trunk still.
// Raise both nearly straight arms forward until the weights reach shoulder height, then lower slowly.
// Both feet remain flat and each dumbbell follows its hand through the same arc.
import type { SideExercise } from '@/exercise.ts';
import { standingFrontRaise } from './_front-raise.ts';

export default standingFrontRaise({
  id: 'dumbbell-front-raise', name: '哑铃前平举', en: 'Dumbbell Front Raise',
  sources: ['fe:Front_Two-Dumbbell_Raise', 'hz:0310', 'hz:0309', 'hz:0834'], implement: 'dumbbell',
}) satisfies SideExercise;
