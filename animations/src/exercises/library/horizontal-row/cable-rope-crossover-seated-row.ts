// Seated facing the low cable station with both feet fixed on the footplate.
// Two ropes cross before the chest, then the elbows draw back without torso rocking.
import type { SideExercise } from '@/exercise.ts';
import { seatedCableRow } from './_horizontal-row-2.ts';

export default seatedCableRow({
  id: 'cable-rope-crossover-seated-row', name: '交叉绳索坐姿划船', en: 'Cable Rope Crossover Seated Row',
  equipment: ['cable'], sources: ['hz:1320'], handle: 'rope', crossover: true,
}) satisfies SideExercise;
