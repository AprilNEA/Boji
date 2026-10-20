// Reverse-grip seated machine row, side view. Keep the chest on the pad and the feet against the footplate.
// Pull the underhand handles toward the chest with the elbows travelling behind the torso.
// The spine stays long against the support while the handles return to full reach.
import type { SideExercise } from '@/exercise.ts';
import { makeMachineRow } from './_horizontal-row-3.ts';

export default makeMachineRow({
  id: 'machine-reverse-grip-seated-row', name: '器械反握坐姿划船', en: 'Machine Reverse-Grip Seated Row',
  equipment: ['machine'], sources: ['hz:1348'],
}, { underhand: true, chestPad: true }) satisfies SideExercise;
