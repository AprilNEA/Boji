// Seated facing a low pulley with feet braced. One hand rows the handle to the torso.
// The seat and feet stay fixed while the cable remains connected to the pulley.
import type { SideExercise } from '@/exercise.ts';
import { seatedRow } from './_horizontal-row-1.ts';

export default seatedRow({
  id: 'cable-kayak-row',
  name: '绳索皮划艇划船',
  meta: { en: 'Cable Kayak Row', family: 'horizontal-row', equipment: ['cable', 'bench'], sources: ['hz:2464'] },
}, { single: true }) satisfies SideExercise;
