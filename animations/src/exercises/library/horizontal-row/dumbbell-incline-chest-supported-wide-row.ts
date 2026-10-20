// Lie prone against a low incline bench with pronated dumbbells below the shoulders.
// Flare both elbows wide until the upper arms align with the back, then lower under control.
import type { SideExercise } from '@/exercise.ts';
import { inclineRow } from './_horizontal-row-2.ts';

export default inclineRow({
  id: 'dumbbell-incline-chest-supported-wide-row', name: '上斜凳胸托宽肘哑铃划船', en: 'Dumbbell Incline Chest-Supported Wide Row',
  equipment: ['dumbbell', 'bench'], sources: ['fe:Incline_Bench_Pull'], weight: 'dumbbell', wide: true,
}) satisfies SideExercise;
