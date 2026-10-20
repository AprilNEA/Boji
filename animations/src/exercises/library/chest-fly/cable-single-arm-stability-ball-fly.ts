// Sit upright on a stability ball with wide, planted feet and a tall spine.
// Keep each working elbow near 159° as its shoulder moves from 93° forward to 90° lateral.
// The ball and feet stay stable while the working cable and D-handle follow the active hand.
import type { FrontExercise } from '@/exercise.ts';
import { makeSingleBallCableFly } from './_chest-fly-1.ts';

export default makeSingleBallCableFly(
  'cable-single-arm-stability-ball-fly', '绳索单臂健身球飞鸟', 'Cable Single-Arm Stability Ball Fly', ['hz:1263'],
) satisfies FrontExercise;
