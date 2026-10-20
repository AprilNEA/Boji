// Lying face down with the chest supported by a 45-degree bench. The pronated bar rows beneath the pad.
// The chest stays on the bench and both feet stay on the floor.
import type { SideExercise } from '@/exercise.ts';
import { inclineRow } from './_horizontal-row-1.ts';

export default inclineRow({
  id: 'barbell-chest-supported-incline-row',
  name: '杠铃上斜俯卧划船',
  meta: { en: 'Barbell Chest-Supported Incline Row', family: 'horizontal-row', equipment: ['barbell', 'bench'], sources: ['hz:0049'] },
}) satisfies SideExercise;
