// Lie chest-down on a 45-degree incline bench with neutral-grip dumbbells hanging below the shoulders.
// Keep the elbows straight while retracting the shoulder blades, then return under control.
import type { SideExercise } from '@/exercise.ts';
import { sideDumbbellBenchShrug } from './_shrug-upright-row.ts';

export default sideDumbbellBenchShrug({
  id: 'dumbbell-incline-scapular-shrug', name: '哑铃上斜俯卧肩胛后缩', en: 'Dumbbell Incline Scapular Shrug',
  sources: ['fe:Middle_Back_Shrug'], kind: 'incline-prone',
}) satisfies SideExercise;
