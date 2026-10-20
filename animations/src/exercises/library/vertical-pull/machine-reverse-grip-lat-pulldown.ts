// Sit upright with feet flat and thighs secured under the pad.
// Pull the underhand handles to the upper chest, then return them overhead with control.
import type { SideExercise } from '@/exercise.ts';
import { machinePulldown } from './_vertical-pull-2.ts';

export default machinePulldown({
  id: 'machine-reverse-grip-lat-pulldown', name: '器械反握高位下拉', en: 'Machine Reverse-Grip Lat Pulldown',
  equipment: ['machine'], sources: ['hz:0673', 'hz:2736'],
}) satisfies SideExercise;
