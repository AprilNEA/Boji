// Brace the chest against the pad and take the wide handle with one hand.
// Pull the elbow down and across toward the opposite hip without twisting.
import type { FrontExercise } from '@/exercise.ts';
import { frontPulldown } from './_vertical-pull-1.ts';

export default frontPulldown({
  id: 'machine-single-arm-wide-grip-lat-pulldown', name: '器械单臂宽握高位下拉', en: 'Machine Single-Arm Wide-Grip Lat Pulldown',
  equipment: ['machine'], sources: ['hz:1347'],
}, { machine: true, unilateral: true, wide: true, chestPad: true }) satisfies FrontExercise;
