// Start with the lead foot fully on the platform and dumbbells hanging at the sides.
// Drive through that heel to stand on the platform, then bring the other foot up with control.
// The lead foot stays supported on the platform throughout the upward phase.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellStepUp } from './_lunge-split-2.ts';

export default dumbbellStepUp({
  id: 'dumbbell-step-up', name: '哑铃登阶', en: 'Dumbbell Step-Up',
  sources: ['fe:Dumbbell_Step_Ups', 'hz:0431', 'hz:2796'],
}) satisfies SideExercise;
