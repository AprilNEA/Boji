// Sit tall with both feet grounded and start with separate overhead handles.
// Pull each handle to the upper chest in turn, while the other arm stays extended.
import type { FrontExercise } from '@/exercise.ts';
import { frontPulldown } from './_vertical-pull-1.ts';

export default frontPulldown({
  id: 'cable-alternating-lat-pulldown', name: '绳索交替高位下拉', en: 'Cable Alternating Lat Pulldown',
  equipment: ['cable'], sources: ['hz:0007'],
}, { unilateral: true, alternating: true }) satisfies FrontExercise;
