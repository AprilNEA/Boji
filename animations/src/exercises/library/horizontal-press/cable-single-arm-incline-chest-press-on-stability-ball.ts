// Starts with the hips supported by a stability ball and the upper back on an incline bench.
// The working elbow extends forward and upward from about 90 degrees while both feet and the supports stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'cable-single-arm-incline-chest-press-on-stability-ball', name: '绳索单臂健身球上斜推胸', en: 'Cable Single-Arm Incline Chest Press on Stability Ball',
  sources: ['hz:1266'],
  support: 'incline-ball', implement: 'cable',
  single: true,
  cableHeight: 'low',
}) satisfies SideExercise;
