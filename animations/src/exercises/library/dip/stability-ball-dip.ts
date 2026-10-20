// Stability-ball dip, side view. Feet stay flat and both hands press the sides of the ball beside the hips.
// The elbows extend to lift the hips clear of the ball, then flex under control to return without rolling it.
import type { SideExercise } from '@/exercise.ts';
import { stabilityBallDip } from './_dip.ts';

export default stabilityBallDip({
  id: 'stability-ball-dip', name: '健身球反向臂屈伸', en: 'Stability Ball Dip', equipment: ['stability-ball'],
  sources: ['hz:1744'],
}) satisfies SideExercise;
