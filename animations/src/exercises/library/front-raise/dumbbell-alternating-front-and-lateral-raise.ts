// Stand with dumbbells at the sides, soft knees and a quiet torso.
// Complete a bilateral front raise to shoulder height, then complete a bilateral lateral raise to shoulder height.
// The feet and trunk stay fixed while each dumbbell follows its own hand.
import type { FrontExercise } from '@/exercise.ts';
import { frontAndLateralRaise } from './_front-raise.ts';

export default frontAndLateralRaise({
  id: 'dumbbell-alternating-front-and-lateral-raise', name: '哑铃前平举与侧平举交替',
  en: 'Dumbbell Alternating Front and Lateral Raise', sources: ['fe:Alternating_Deltoid_Raise'],
}) satisfies FrontExercise;
