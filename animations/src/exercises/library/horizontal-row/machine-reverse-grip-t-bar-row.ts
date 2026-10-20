// Reverse-grip T-bar machine row, side view. Sit with the chest on the support and feet flat on the floor.
// Pull the required underhand handle toward the chest with the elbows close to the torso.
// Keep the back straight against the pad while the elbows flex and the handle returns.
import type { SideExercise } from '@/exercise.ts';
import { makeMachineRow } from './_horizontal-row-3.ts';

export default makeMachineRow({
  id: 'machine-reverse-grip-t-bar-row', name: '器械反握丁字杠划船', en: 'Machine Reverse-Grip T-Bar Row',
  equipment: ['machine'], sources: ['hz:1351'],
}, { chestPad: true, underhand: true }) satisfies SideExercise;
