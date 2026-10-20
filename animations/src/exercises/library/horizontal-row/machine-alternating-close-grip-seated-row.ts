// Alternating close-grip seated machine row, side view. Sit tall with the feet planted on the footplate.
// One neutral handle pulls to the torso while the other returns, then the sides exchange roles.
// The pelvis stays on the seat and the chest remains lifted without rocking back.
import type { SideExercise } from '@/exercise.ts';
import { makeMachineRow } from './_horizontal-row-3.ts';

export default makeMachineRow({
  id: 'machine-alternating-close-grip-seated-row', name: '器械交替窄握坐姿划船', en: 'Machine Alternating Close-Grip Seated Row',
  equipment: ['machine'], sources: ['hz:0571'],
}, { close: true, alternating: true }) satisfies SideExercise;
