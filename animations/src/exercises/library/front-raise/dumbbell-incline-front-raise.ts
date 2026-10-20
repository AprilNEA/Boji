// Sit against a 50-degree incline bench with the head and back supported and both feet planted.
// Start with straight arms in front of the thighs, then raise both dumbbells toward overhead.
// The torso stays on the backrest while each dumbbell follows the corresponding hand.
import type { SideExercise } from '@/exercise.ts';
import { inclineDumbbellFrontRaise } from './_front-raise.ts';

export default inclineDumbbellFrontRaise({
  id: 'dumbbell-incline-front-raise', name: '哑铃上斜前平举', en: 'Dumbbell Incline Front Raise',
  sources: ['fe:Front_Incline_Dumbbell_Raise'],
}) satisfies SideExercise;
