// Standing in a fixed hip hinge with a neutral spine. Both hands row the bar to the lower chest.
// The feet stay planted and the torso does not rise during the row.
import type { SideExercise } from '@/exercise.ts';
import { bentBarRow } from './_horizontal-row-1.ts';

export default bentBarRow({
  id: 'barbell-bent-over-row',
  name: '杠铃俯身划船',
  meta: { en: 'Barbell Bent-Over Row', family: 'horizontal-row', equipment: ['barbell'], sources: ['hz:0027', 'hz:0574'] },
}, {}) satisfies SideExercise;
