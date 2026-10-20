// Sit upright on a stability ball with feet flat, wide and stable on the ground.
// Hold a dumbbell at one side and laterally flex the torso without rotating.
// Both feet stay planted while the pelvis remains centered on the ball.
import type { FrontExercise } from '@/exercise.ts';
import { stabilityBallSeated } from './_core-lateral.ts';

const exercise = stabilityBallSeated({
  id: 'stability-ball-weighted-seated-side-bend', name: '健身球负重坐姿体侧屈', en: 'Stability Ball Weighted Seated Side Bend',
  sources: ['hz:0850'],
});
export default exercise satisfies FrontExercise;
