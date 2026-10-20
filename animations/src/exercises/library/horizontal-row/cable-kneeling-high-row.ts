// Kneeling upright facing a chest-height cable. Both hands pull the bar to the upper abdomen.
// The knees stay on the floor and the cable remains connected to the pulley.
import type { SideExercise } from '@/exercise.ts';
import { kneelingRow } from './_horizontal-row-1.ts';

export default kneelingRow({
  id: 'cable-kneeling-high-row',
  name: '绳索跪姿高位划船',
  meta: { en: 'Cable Kneeling High Row', family: 'horizontal-row', equipment: ['cable'], sources: ['hz:0167'] },
}, { chest: true }) satisfies SideExercise;
