// Close-grip seated machine row, side view. Sit with the feet on the supports and a straight, slightly forward torso.
// Pull both neutral handles to the abdomen, pause, and return them under control.
// The seat fixes the hips, so the repetition comes from shoulder retraction and elbow flexion.
import type { SideExercise } from '@/exercise.ts';
import { makeMachineRow } from './_horizontal-row-3.ts';

export default makeMachineRow({
  id: 'machine-close-grip-seated-row', name: '器械窄握坐姿划船', en: 'Machine Close-Grip Seated Row',
  equipment: ['machine'], sources: ['hz:0588'],
}, { close: true, forward: true }) satisfies SideExercise;
