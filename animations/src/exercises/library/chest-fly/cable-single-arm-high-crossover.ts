// Stand forward of high pulleys with a slight lean and both handles together before the chest.
// Keep each working elbow near 159° as its shoulder opens from 95° forward to 92° lateral.
// The staggered feet, torso, pulleys, cable paths, and idle handle remain stable in both halves.
import type { FrontExercise } from '@/exercise.ts';
import { makeAlternatingHighCable } from './_chest-fly-1.ts';

export default makeAlternatingHighCable(
  'cable-single-arm-high-crossover', '绳索单臂高位夹胸', 'Cable Single-Arm High Crossover', ['fe:Single-Arm_Cable_Crossover'],
) satisfies FrontExercise;
