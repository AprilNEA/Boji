// Lie flat with neutral-grip dumbbells above the torso and upper arms held vertical.
// Bend both elbows to lower the dumbbells near the forehead, then straighten the elbows.
import type { SideExercise } from '@/exercise.ts';
import { lyingTricepsExtension } from './_triceps-extension-2.ts';

export default lyingTricepsExtension({
  id: 'dumbbell-lying-triceps-extension', name: '哑铃仰卧臂屈伸',
  meta: { en: 'Dumbbell Lying Triceps Extension', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['fe:Lying_Dumbbell_Tricep_Extension', 'hz:0338', 'hz:0351'] },
}) satisfies SideExercise;
