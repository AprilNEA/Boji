// Sit with the thigh pad holding the pelvis down and one pronated handle overhead.
// Draw the working elbow to the side, then restore the controlled overhead reach.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-single-arm-pronated-lat-pulldown', name: '绳索单臂正握高位下拉', en: 'Cable Single-Arm Pronated Lat Pulldown',
  equipment: ['cable', 'machine'], sources: ['fe:One_Arm_Lat_Pulldown'],
}, { attachment: 'd', unilateral: true }) satisfies SideExercise;
