// Sit upright with one dumbbell held overhead in an underhand grip and the upper arm close to the ear.
// Bend the elbow to lower the dumbbell behind the head, then return to a straight arm.
import type { SideExercise } from '@/exercise.ts';
import { seatedOverheadExtension } from './_triceps-extension-2.ts';

export default seatedOverheadExtension({
  id: 'dumbbell-seated-single-arm-reverse-grip-overhead-triceps-extension', name: '哑铃坐姿单臂反握颈后臂屈伸', single: true, grip: 'end',
  meta: { en: 'Dumbbell Seated Single-Arm Reverse-Grip Overhead Triceps Extension', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['hz:1738'] },
}) satisfies SideExercise;
