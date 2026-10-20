// Stand in a wide stance and hold one dumbbell with both hands near the waist.
// Keep the arms extended as the shared dumbbell rises in front to above shoulder level, then lowers.
// The torso, hips and planted feet stay fixed while both hands retain the shared weight.
import type { SideExercise } from '@/exercise.ts';
import { standingFrontRaise } from './_front-raise.ts';

export default standingFrontRaise({
  id: 'dumbbell-two-hand-front-raise', name: '哑铃双手前平举', en: 'Dumbbell Two-Hand Front Raise',
  sources: ['fe:Single_Dumbbell_Raise'], implement: 'two-hand-dumbbell', top: -6,
}) satisfies SideExercise;
