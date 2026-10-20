// Sit on a stability ball facing away from high pulleys with both feet firmly on the ground.
// Keep both elbows near 159° as each shoulder travels from 92° lateral to about 96° forward.
// The torso stays braced while the ball, feet, pulley points, cables, and handles remain connected.
import type { FrontExercise } from '@/exercise.ts';
import { makeBallCableFly } from './_chest-fly-1.ts';

export default makeBallCableFly(
  'cable-stability-ball-incline-fly', '绳索健身球飞鸟', 'Cable Stability Ball Incline Fly', ['hz:0170'],
) satisfies FrontExercise;
