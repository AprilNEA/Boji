// Holding a bar from a parallel-back hip hinge. The bar rows from near the floor to the upper abdomen.
// The feet stay planted and the torso remains still between repetitions.
import type { SideExercise } from '@/exercise.ts';
import { bentBarRow } from './_horizontal-row-1.ts';

export default bentBarRow({
  id: 'barbell-pendlay-row',
  name: '杠铃潘德雷划船',
  meta: { en: 'Barbell Pendlay Row', family: 'horizontal-row', equipment: ['barbell'], sources: ['hz:3017'] },
}, { pendlay: true }) satisfies SideExercise;
