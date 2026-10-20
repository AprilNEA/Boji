// Holding the bar underhand in a fixed hip hinge. Both hands row the bar toward the abdomen.
// The feet stay planted and the back remains neutral.
import type { SideExercise } from '@/exercise.ts';
import { bentBarRow } from './_horizontal-row-1.ts';

export default bentBarRow({
  id: 'barbell-reverse-grip-bent-over-row',
  name: '杠铃反握俯身划船',
  meta: { en: 'Barbell Reverse-Grip Bent-Over Row', family: 'horizontal-row', equipment: ['barbell'], sources: ['fe:Reverse_Grip_Bent-Over_Rows', 'hz:0118'] },
}, { reverse: true }) satisfies SideExercise;
