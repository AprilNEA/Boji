// Standing in a hip hinge with one hand on a bar. The working hand rows the bar toward the chest.
// The feet stay planted and the free hand rests by the hip.
import type { SideExercise } from '@/exercise.ts';
import { bentBarRow } from './_horizontal-row-1.ts';

export default bentBarRow({
  id: 'barbell-single-arm-bent-over-row',
  name: '杠铃单臂俯身划船',
  meta: { en: 'Barbell Single-Arm Bent-Over Row', family: 'horizontal-row', equipment: ['barbell'], sources: ['hz:0064'] },
}, { single: true }) satisfies SideExercise;
