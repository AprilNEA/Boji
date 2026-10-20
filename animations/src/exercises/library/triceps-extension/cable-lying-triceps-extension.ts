// Lie supine on a flat bench with the upper arms vertical over the torso.
// Bend only the elbows to bring the low-cable bar near the forehead, then straighten them.
import type { SideExercise } from '@/exercise.ts';
import { lyingTricepsExtension } from './_triceps-extension-2.ts';

export default lyingTricepsExtension({
  id: 'cable-lying-triceps-extension', name: '绳索仰卧臂屈伸', cable: true,
  meta: { en: 'Cable Lying Triceps Extension', family: 'triceps-extension', equipment: ['cable', 'bench'], sources: ['fe:Cable_Lying_Triceps_Extension'] },
}) satisfies SideExercise;
