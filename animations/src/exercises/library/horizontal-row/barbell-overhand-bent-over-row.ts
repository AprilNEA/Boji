// Holding the bar with an overhand grip in a near-parallel hip hinge. The bar rows to the lower chest.
// The feet stay planted and the torso remains still.
import type { SideExercise } from '@/exercise.ts';
import { bentBarRow } from './_horizontal-row-1.ts';

export default bentBarRow({
  id: 'barbell-overhand-bent-over-row',
  name: '杠铃正握俯身划船',
  meta: { en: 'Barbell Overhand Bent-Over Row', family: 'horizontal-row', equipment: ['barbell'], sources: ['fe:Bent_Over_Barbell_Row'] },
}, {}) satisfies SideExercise;
