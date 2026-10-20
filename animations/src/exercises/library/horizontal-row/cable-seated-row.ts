// Sit at the low-pulley row station with both feet fixed to the plate.
// The handles travel to the abdomen as the shoulder blades retract without a large torso swing.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableRow } from './_horizontal-row-2.ts';

export default seatedCableRow({
  id: 'cable-seated-row', name: '坐姿划船', en: 'Cable Seated Row',
  equipment: ['cable'], sources: ['hz:0861'], handle: 'straight',
}) satisfies SideExercise;
