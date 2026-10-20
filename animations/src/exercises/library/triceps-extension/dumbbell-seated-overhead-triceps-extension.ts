// Sit upright with the back supported, feet planted, and both hands holding one dumbbell overhead.
// Keep upper arms beside the ears while lowering the dumbbell behind the head and extending it up.
import type { SideExercise } from '@/exercise.ts';
import { seatedOverheadExtension } from './_triceps-extension-2.ts';

export default seatedOverheadExtension({
  id: 'dumbbell-seated-overhead-triceps-extension', name: '哑铃坐姿颈后臂屈伸',
  meta: { en: 'Dumbbell Seated Overhead Triceps Extension', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['fe:Seated_Triceps_Press', 'hz:0389', 'hz:2188', 'hz:2189'] },
}) satisfies SideExercise;
