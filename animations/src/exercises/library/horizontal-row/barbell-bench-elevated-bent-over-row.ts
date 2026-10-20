// Standing on a bench in a fixed hinge. The pronated bar travels from long arms to the torso.
// Both feet stay on the bench. The torso remains braced during the row.
import type { SideExercise } from '@/exercise.ts';
import { bentBarRow } from './_horizontal-row-1.ts';

export default bentBarRow({
  id: 'barbell-bench-elevated-bent-over-row',
  name: '杠铃凳上俯身划船',
  meta: { en: 'Barbell Bench-Elevated Bent-Over Row', family: 'horizontal-row', equipment: ['barbell', 'bench'], sources: ['fe:Straight_Bar_Bench_Mid_Rows'] },
}, { bench: true }) satisfies SideExercise;
