// Single-arm seated machine row, side view. Sit tall and keep the pelvis fixed on the seat.
// Pull one handle to the body and squeeze the shoulder blade without turning the torso.
// The free hand stays on the thigh as the working elbow extends under control.
import type { SideExercise } from '@/exercise.ts';
import { makeMachineRow } from './_horizontal-row-3.ts';

export default makeMachineRow({
  id: 'machine-single-arm-seated-row', name: '器械单臂坐姿划船', en: 'Machine Single-Arm Seated Row',
  equipment: ['machine'], sources: ['hz:1313'],
}, { single: true }) satisfies SideExercise;
