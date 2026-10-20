// Sit with both feet flat and hinge forward until the back is nearly parallel to the floor.
// Keep the working upper arm close to the body while extending the dumbbell backward at the elbow.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellKickback } from './_triceps-extension-2.ts';

export default dumbbellKickback({
  id: 'dumbbell-seated-single-arm-triceps-kickback', name: '哑铃坐姿单臂俯身臂屈伸', seated: true, single: true,
  meta: { en: 'Dumbbell Seated Single-Arm Triceps Kickback', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['hz:0398'] },
}) satisfies SideExercise;
