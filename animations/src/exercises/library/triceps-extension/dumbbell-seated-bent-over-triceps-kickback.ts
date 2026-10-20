// Sit at the bench edge and hinge forward with both upper arms aligned beside the torso.
// Extend both dumbbells backward from bent elbows while the torso and shoulders stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellKickback } from './_triceps-extension-2.ts';

export default dumbbellKickback({
  id: 'dumbbell-seated-bent-over-triceps-kickback', name: '哑铃坐姿俯身双臂臂屈伸', seated: true,
  meta: { en: 'Dumbbell Seated Bent-Over Triceps Kickback', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['fe:Seated_Bent-Over_Two-Arm_Dumbbell_Triceps_Extension'] },
}) satisfies SideExercise;
