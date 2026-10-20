// Lie face down on an incline bench with the chest supported and the barbell hanging from straight arms.
// Raise the barbell forward in front of the head without moving the torso, then return to the hanging position.
// The bench supports the body while both hands retain the shared barbell grip.
import type { SideExercise } from '@/exercise.ts';
import { proneInclineBarbellRaise } from './_front-raise.ts';

export default proneInclineBarbellRaise({
  id: 'barbell-prone-incline-bench-front-raise', name: '杠铃上斜凳俯卧前平举',
  en: 'Barbell Prone Incline Bench Front Raise', sources: ['fe:Straight_Raises_on_Incline_Bench'],
}) satisfies SideExercise;
