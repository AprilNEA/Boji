// Machine high row, side view. Sit under the thigh restraint with the torso upright and the feet on the platform.
// Start with the overhead handles within reach, then pull them down toward the upper torso.
// The hips stay seated and the shoulders retract without shrugging or leaning back.
import type { SideExercise } from '@/exercise.ts';
import { makeMachineRow } from './_horizontal-row-3.ts';

export default makeMachineRow({
  id: 'machine-high-row', name: '器械高位划船', en: 'Machine High Row',
  equipment: ['machine'], sources: ['fe:Leverage_High_Row', 'hz:0581'],
}, { high: true }) satisfies SideExercise;
