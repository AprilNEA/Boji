// Sitting into an incline bench with the chest against the backrest. The underhand bar rows to the upper abdomen.
// The chest stays supported and both feet remain grounded.
import type { SideExercise } from '@/exercise.ts';
import { inclineRow } from './_horizontal-row-1.ts';

export default inclineRow({
  id: 'barbell-reverse-grip-incline-bench-row',
  name: '杠铃反握上斜俯卧划船',
  meta: { en: 'Barbell Reverse-Grip Incline Bench Row', family: 'horizontal-row', equipment: ['barbell', 'bench'], sources: ['hz:1317'] },
}, { reverse: true }) satisfies SideExercise;
