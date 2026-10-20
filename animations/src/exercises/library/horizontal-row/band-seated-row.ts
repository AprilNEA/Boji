// Seated on the floor with both legs extended. Both hands row the band from the feet to the abdomen.
// The feet remain the band anchor and the back stays tall.
import type { SideExercise } from '@/exercise.ts';
import { seatedRow } from './_horizontal-row-1.ts';

export default seatedRow({
  id: 'band-seated-row',
  name: '弹力带坐姿划船',
  meta: { en: 'Band Seated Row', family: 'horizontal-row', equipment: ['band'], sources: ['hz:3144'] },
}, { band: true, floor: true }) satisfies SideExercise;
