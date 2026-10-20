// Machine T-bar row, side view. Sit with the chest against the support and both feet on the footplate.
// Pull the wide overhand handles toward the torso and pause at the peak contraction.
// The chest pad keeps the back straight while the elbows extend on the return.
import type { SideExercise } from '@/exercise.ts';
import { makeMachineRow } from './_horizontal-row-3.ts';

export default makeMachineRow({
  id: 'machine-t-bar-row', name: '器械丁字杠划船', en: 'Machine T-Bar Row',
  equipment: ['machine'], sources: ['hz:0606'],
}, { chestPad: true }) satisfies SideExercise;
