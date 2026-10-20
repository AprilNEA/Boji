// Sit against a 45-degree incline bench with both feet flat and neutral-grip dumbbells at the sides.
// Keep the arms straight while lifting the shoulders toward the ears, then lower with control.
import type { SideExercise } from '@/exercise.ts';
import { sideDumbbellBenchShrug } from './_shrug-upright-row.ts';

export default sideDumbbellBenchShrug({
  id: 'dumbbell-incline-shrug', name: '哑铃上斜耸肩', en: 'Dumbbell Incline Shrug',
  sources: ['hz:0329'], kind: 'incline-seated',
}) satisfies SideExercise;
