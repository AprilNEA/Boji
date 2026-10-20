// Single-arm high row, side view. Sit tall facing the machine and keep the torso square.
// Pull one elevated handle down toward the ribs with the elbow close to the side.
// The free hand rests on the thigh and the seat prevents trunk rotation.
import type { SideExercise } from '@/exercise.ts';
import { makeMachineRow } from './_horizontal-row-3.ts';

export default makeMachineRow({
  id: 'machine-single-arm-high-row', name: '器械单臂高位划船', en: 'Machine Single-Arm High Row',
  equipment: ['machine'], sources: ['hz:1356'],
}, { high: true, single: true }) satisfies SideExercise;
