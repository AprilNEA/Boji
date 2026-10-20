// Recline on an incline bench with the rope cable behind the head.
// Keep the upper arms beside the head and extend only through both elbows.
import type { SideExercise } from '@/exercise.ts';
import { cableOverheadExtension } from './_triceps-extension-2.ts';

export default cableOverheadExtension({
  id: 'cable-rope-incline-triceps-extension', name: '绳索绳把上斜臂屈伸', rope: true, incline: true,
  meta: { en: 'Cable Rope Incline Triceps Extension', family: 'triceps-extension', equipment: ['cable', 'bench'], sources: ['hz:1725'] },
}) satisfies SideExercise;
