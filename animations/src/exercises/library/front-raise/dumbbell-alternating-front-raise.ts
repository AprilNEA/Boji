// Stand upright with both dumbbells resting in front of the thighs and avoid torso swing.
// Raise one softly bent arm to slightly above shoulder height, lower it, then repeat with the other arm.
// Both feet remain flat and each dumbbell stays attached to the hand that moves it.
import type { SideExercise } from '@/exercise.ts';
import { standingFrontRaise } from './_front-raise.ts';

export default standingFrontRaise({
  id: 'dumbbell-alternating-front-raise', name: '哑铃交替前平举', en: 'Dumbbell Alternating Front Raise',
  sources: ['fe:Front_Dumbbell_Raise'], implement: 'dumbbell', alternate: true, top: -6,
}) satisfies SideExercise;
