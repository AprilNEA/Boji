// Seated machine row, side view. Sit against the chest pad with both feet on the footrests.
// Pull the shoulder-width handles toward the body and squeeze the shoulder blades at the end.
// The chest support keeps the torso stable while the elbows flex and extend.
import type { SideExercise } from '@/exercise.ts';
import { makeMachineRow } from './_horizontal-row-3.ts';

export default makeMachineRow({
  id: 'machine-seated-row', name: '器械坐姿划船', en: 'Machine Seated Row',
  equipment: ['machine'], sources: ['hz:1350'],
}, { chestPad: true }) satisfies SideExercise;
