// Stand facing the high pulley with the working arm fully extended.
// Pull the handle to the side as the elbow tracks close to the ribs.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-standing-single-arm-lat-pulldown', name: '绳索站姿单臂高位下拉', en: 'Cable Standing Single-Arm Lat Pulldown',
  equipment: ['cable'], sources: ['hz:3563'],
}, { mode: 'standing', attachment: 'd', unilateral: true }) satisfies SideExercise;
