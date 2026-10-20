// Start in a high prone position with hands on the floor and straight toes resting on the stability ball.
// Brace the trunk as both straight legs lift from the ball, then return without moving the hands.
import type { SideExercise } from '@/exercise.ts';
import { ballProneLegRaise } from './_back-extension.ts';

export default ballProneLegRaise({
  id: 'stability-ball-prone-leg-raise', name: '健身球俯卧抬腿',
  meta: { en: 'Stability Ball Prone Leg Raise', family: 'back-extension', equipment: ['stability-ball', 'mat'], sources: ['hz:1343'] },
}) satisfies SideExercise;
