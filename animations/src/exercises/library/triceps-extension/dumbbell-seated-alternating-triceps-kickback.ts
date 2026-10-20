// Sit on the bench edge with the back straight and torso folded forward over the thighs.
// Keep upper arms fixed and alternate each dumbbell from a bent elbow to a backward extension.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellKickback } from './_triceps-extension-2.ts';

export default dumbbellKickback({
  id: 'dumbbell-seated-alternating-triceps-kickback', name: '哑铃坐姿交替俯身臂屈伸', seated: true, alternating: true,
  meta: { en: 'Dumbbell Seated Alternating Triceps Kickback', family: 'triceps-extension', equipment: ['dumbbell', 'bench'], sources: ['hz:1730'] },
}) satisfies SideExercise;
