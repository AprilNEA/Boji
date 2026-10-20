// Start with hands on the floor and shins resting on a stability ball, then lift the hips into a pike.
// Bend the elbows to bring the head between the hands and press back up while the shins stay on the ball.
import type { SideExercise } from '@/exercise.ts';
import { ballPike } from './_push-up-2.ts';

export default ballPike({
  id: 'stability-ball-pike-push-up', name: '健身球折髋俯卧撑', en: 'Stability Ball Pike Push-Up',
  equipment: ['bodyweight', 'stability-ball'], sources: ['hz:1296'],
}) satisfies SideExercise;
