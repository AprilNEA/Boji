// Braced against a 45-degree incline bench and facing a low cable. The handle pulls from long arms to the chest.
// The feet remain flat and the cable stays attached to the low pulley.
import type { SideExercise } from '@/exercise.ts';
import { inclineRow } from './_horizontal-row-1.ts';

export default inclineRow({
  id: 'cable-incline-bench-row',
  name: '绳索上斜凳划船',
  meta: { en: 'Cable Incline Bench Row', family: 'horizontal-row', equipment: ['cable', 'bench'], sources: ['hz:1318'] },
}, { cable: true }) satisfies SideExercise;
