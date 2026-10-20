// Reverse T-bar machine row, side view. Keep the chest against the pad and the feet on the footplate.
// Pull the wide overhand handles toward the torso while retracting the shoulder blades.
// The support fixes the trunk, so the elbows extend again without rocking backward.
import type { SideExercise } from '@/exercise.ts';
import { makeMachineRow } from './_horizontal-row-3.ts';

export default makeMachineRow({
  id: 'machine-reverse-t-bar-row', name: '器械反向丁字杠划船', en: 'Machine Reverse T-Bar Row',
  equipment: ['machine'], sources: ['hz:1349'],
}, { chestPad: true }) satisfies SideExercise;
