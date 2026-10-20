// Sit upright with knees beneath the pads and hands on the machine handles.
// Draw both handles down to the upper chest, then restore the overhead reach.
import type { FrontExercise } from '@/exercise.ts';
import { frontPulldown } from './_vertical-pull-1.ts';

export default frontPulldown({
  id: 'machine-front-lat-pulldown', name: '器械胸前高位下拉', en: 'Machine Front Lat Pulldown',
  equipment: ['machine'], sources: ['hz:0579'],
}, { machine: true }) satisfies FrontExercise;
