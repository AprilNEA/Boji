// Seated on the floor with legs extended facing a low cable. Both hands row a wide bar to the waist.
// The feet and floor stay fixed while the cable remains connected to the pulley.
import type { SideExercise } from '@/exercise.ts';
import { seatedRow } from './_horizontal-row-1.ts';

export default seatedRow({
  id: 'cable-floor-seated-wide-grip-row',
  name: '绳索地板坐姿宽握划船',
  meta: { en: 'Cable Floor Seated Wide-Grip Row', family: 'horizontal-row', equipment: ['cable'], sources: ['hz:0160'] },
}, { wide: true, floor: true }) satisfies SideExercise;
