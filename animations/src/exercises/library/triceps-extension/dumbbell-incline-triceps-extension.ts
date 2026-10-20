// Recline on an incline bench with a dumbbell in each hand and upper arms beside the head.
// Bend both elbows to lower the weights behind the head, then return by elbow extension.
import type { SideExercise } from '@/exercise.ts';
import { lyingTricepsExtension } from './_triceps-extension-2.ts';

export default lyingTricepsExtension({
  id: 'dumbbell-incline-triceps-extension', name: '哑铃上斜臂屈伸', incline: true,
  meta: { en: 'Dumbbell Incline Triceps Extension', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['hz:0330', 'hz:1733'] },
}) satisfies SideExercise;
