// Kneeling facing a high pulley with arms extended. Both hands pull the rope to the upper chest.
// The knees stay on the floor and the cable remains connected to the pulley.
import type { SideExercise } from '@/exercise.ts';
import { kneelingRow } from './_horizontal-row-1.ts';

export default kneelingRow({
  id: 'cable-kneeling-high-pulley-row',
  name: '绳索跪姿高位划船',
  meta: { en: 'Cable Kneeling High Pulley Row', family: 'horizontal-row', equipment: ['cable'], sources: ['fe:Kneeling_High_Pulley_Row'] },
}, { rope: true }) satisfies SideExercise;
