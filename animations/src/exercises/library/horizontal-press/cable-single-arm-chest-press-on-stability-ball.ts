// Starts upright on a stability ball with feet planted and the free hand resting near the hip.
// The working elbow extends from about 90 degrees without rotating the torso or rolling the ball.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'cable-single-arm-chest-press-on-stability-ball', name: '绳索单臂健身球推胸', en: 'Cable Single-Arm Chest Press on Stability Ball',
  sources: ['hz:1267'],
  support: 'ball-seat', implement: 'cable',
  single: true,
  cableHeight: 'mid',
}) satisfies SideExercise;
