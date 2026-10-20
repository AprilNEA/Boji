// Iso-lateral machine row, side view. Sit upright with the handles level with the chest.
// Pull the independent lever handles to the torso by retracting the shoulder blades and flexing the elbows.
// The pelvis stays on the seat and the handles return without dropping onto the stops.
import type { SideExercise } from '@/exercise.ts';
import { makeMachineRow } from './_horizontal-row-3.ts';

export default makeMachineRow({
  id: 'machine-iso-lateral-row', name: '器械独立臂划船', en: 'Machine Iso-Lateral Row',
  equipment: ['machine'], sources: ['fe:Leverage_Iso_Row'],
}) satisfies SideExercise;
