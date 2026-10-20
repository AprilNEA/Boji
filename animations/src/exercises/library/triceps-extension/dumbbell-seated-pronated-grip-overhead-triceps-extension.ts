// Sit upright with a pronated two-hand dumbbell grip and upper arms vertical beside the head.
// Lower the dumbbell behind the head through elbow flexion, then extend both elbows overhead.
import type { SideExercise } from '@/exercise.ts';
import { seatedOverheadExtension } from './_triceps-extension-2.ts';

export default seatedOverheadExtension({
  id: 'dumbbell-seated-pronated-grip-overhead-triceps-extension', name: '坐姿哑铃正握颈后臂屈伸', grip: 'end',
  meta: { en: 'Dumbbell Seated Pronated-Grip Overhead Triceps Extension', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['hz:0373'] },
}) satisfies SideExercise;
