// Lie on a flat bench with both dumbbells held above the chest and upper arms vertical.
// Lower one dumbbell by elbow flexion while the other arm remains extended, then alternate.
import type { SideExercise } from '@/exercise.ts';
import { lyingTricepsExtension } from './_triceps-extension-2.ts';

export default lyingTricepsExtension({
  id: 'dumbbell-alternating-lying-triceps-extension', name: '哑铃交替仰卧臂屈伸', alternating: true,
  meta: { en: 'Dumbbell Alternating Lying Triceps Extension', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['hz:1729'] },
}) satisfies SideExercise;
