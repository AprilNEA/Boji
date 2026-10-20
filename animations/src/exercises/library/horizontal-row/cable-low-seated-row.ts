// Seated facing a low cable with feet braced. Both hands row the handle toward the waist.
// The seat and feet stay fixed while the cable remains connected to the pulley.
import type { SideExercise } from '@/exercise.ts';
import { seatedRow } from './_horizontal-row-1.ts';

export default seatedRow({
  id: 'cable-low-seated-row',
  name: '绳索低位坐姿划船',
  meta: { en: 'Cable Low Seated Row', family: 'horizontal-row', equipment: ['cable', 'bench'], sources: ['hz:0180'] },
}, {}) satisfies SideExercise;
