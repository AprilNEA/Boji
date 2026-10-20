// Seated facing a low cable with a wide overhand grip. Both hands row the handle to the lower chest.
// The seat and feet stay fixed while the cable remains connected to the pulley.
import type { SideExercise } from '@/exercise.ts';
import { seatedRow } from './_horizontal-row-1.ts';

export default seatedRow({
  id: 'cable-decline-seated-wide-grip-row',
  name: '绳索下斜坐姿宽握划船',
  meta: { en: 'Cable Decline Seated Wide-Grip Row', family: 'horizontal-row', equipment: ['cable', 'bench'], sources: ['hz:0159'] },
}, { wide: true, decline: true }) satisfies SideExercise;
