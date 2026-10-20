// Sit at the bench edge with the torso almost parallel to the floor and the working arm near the body.
// Hold the upper arm fixed while extending the dumbbell backward from a right-angle elbow.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellKickback } from './_triceps-extension-2.ts';

export default dumbbellKickback({
  id: 'dumbbell-seated-bent-over-single-arm-triceps-kickback', name: '哑铃坐姿俯身单臂臂屈伸', seated: true, single: true,
  meta: { en: 'Dumbbell Seated Bent-Over Single-Arm Triceps Kickback', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['fe:Seated_Bent-Over_One-Arm_Dumbbell_Triceps_Extension'] },
}) satisfies SideExercise;
