// Stand facing the low pulley with soft knees and a fixed hip hinge.
// The neutral single handle rows to the lower chest while the free hand stays at the waist.
import type { SideExercise } from '@/exercise.ts';
import { hingeRow } from './_horizontal-row-2.ts';

export default hingeRow({
  id: 'cable-single-arm-bent-over-row', name: '单臂俯身绳索划船', en: 'Cable Single-Arm Bent-Over Row',
  equipment: ['cable'], sources: ['hz:0189'], weight: 'dumbbell', cable: true, single: true, handle: 'single',
}) satisfies SideExercise;
