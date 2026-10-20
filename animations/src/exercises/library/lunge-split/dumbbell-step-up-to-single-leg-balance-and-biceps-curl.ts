// Start with dumbbells hanging and the lead foot flat on the step.
// Stand on that one leg, lift the trailing knee, and curl both dumbbells toward the shoulders.
// The platform foot remains the only support at the balanced top position.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellStepUp } from './_lunge-split-2.ts';

export default dumbbellStepUp({
  id: 'dumbbell-step-up-to-single-leg-balance-and-biceps-curl', name: '哑铃上台阶单腿平衡弯举',
  en: 'Dumbbell Step-Up to Single-Leg Balance and Biceps Curl', sources: ['hz:1684'], kneeRaise: true, curl: true,
}) satisfies SideExercise;
