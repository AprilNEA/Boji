// Sit square to the low pulley with the feet braced and the free hand held at the waist.
// Row one pronated handle toward the abdomen while the shoulder blade retracts and the torso stays fixed.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableRow } from './_horizontal-row-2.ts';

export default seatedCableRow({
  id: 'cable-seated-single-arm-overhand-row', name: '坐姿单臂正握划船', en: 'Cable Seated Single-Arm Overhand Row',
  equipment: ['cable'], sources: ['fe:Seated_One-arm_Cable_Pulley_Rows'], handle: 'single', single: true, rotate: true,
}) satisfies SideExercise;
