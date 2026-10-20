// Support one knee and the same-side hand on a 45-degree bench with the back flat.
// Row the opposite dumbbell toward the chest with the source's palm-down grip, then lower it vertically.
import type { SideExercise } from '@/exercise.ts';
import { benchSupportedRow } from './_horizontal-row-2.ts';

export default benchSupportedRow({
  id: 'dumbbell-reverse-grip-incline-bench-single-arm-row', name: '上斜凳单臂哑铃划船', en: 'Dumbbell Reverse-Grip Incline Bench Single-Arm Row',
  equipment: ['dumbbell', 'bench'], sources: ['hz:1330'], reverse: true, incline: true,
}) satisfies SideExercise;
