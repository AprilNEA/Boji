// Kneeling facing a high cable with one arm extended. The working hand rows the handle to the torso.
// The knees stay on the floor and the cable remains connected to the pulley.
import type { SideExercise } from '@/exercise.ts';
import { kneelingRow } from './_horizontal-row-1.ts';

export default kneelingRow({
  id: 'cable-kneeling-single-arm-high-row',
  name: '绳索跪姿单臂高位划船',
  meta: { en: 'Cable Kneeling Single-Arm High Row', family: 'horizontal-row', equipment: ['cable'], sources: ['fe:Kneeling_Single-Arm_High_Pulley_Row', 'hz:0193'] },
}, { single: true }) satisfies SideExercise;
