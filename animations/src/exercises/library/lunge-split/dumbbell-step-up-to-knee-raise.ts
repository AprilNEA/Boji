// Start with dumbbells at the sides and the lead foot completely supported on the step.
// Step up through the lead heel as the trailing knee rises toward the chest.
// Keep the lead foot on the step and do not use the free leg for support.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellStepUp } from './_lunge-split-2.ts';

export default dumbbellStepUp({
  id: 'dumbbell-step-up-to-knee-raise', name: '哑铃上台阶提膝', en: 'Dumbbell Step-Up to Knee Raise',
  sources: ['hz:2812'], kneeRaise: true,
}) satisfies SideExercise;
