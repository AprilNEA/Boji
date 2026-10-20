// Stand between the shoulder-height cables with a stable hip-width stance.
// Hinge forward slightly and draw the crossed handles down toward the opposite sides.
import type { FrontExercise } from '@/exercise.ts';
import { frontPulldown } from './_vertical-pull-1.ts';

export default frontPulldown({
  id: 'cable-crossover-lat-pulldown', name: '绳索交叉高位下拉', en: 'Cable Crossover Lat Pulldown',
  equipment: ['cable'], sources: ['hz:0153'],
}, { crossover: true }) satisfies FrontExercise;
