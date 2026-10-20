// Kneel tall with the knees hip-width apart, shins down and dumbbells in front of the thighs.
// Swing both straight arms forward and overhead, then lower them with a braced, upright torso.
// The knees, shins and torso stay fixed while each dumbbell follows its hand.
import type { SideExercise } from '@/exercise.ts';
import { kneelingDumbbellOverheadRaise } from './_front-raise.ts';

export default kneelingDumbbellOverheadRaise({
  id: 'dumbbell-kneeling-step-with-arm-swing', name: '哑铃跪姿摆臂', en: 'Dumbbell Kneeling Step with Arm Swing',
  sources: ['hz:3641'],
}) satisfies SideExercise;
