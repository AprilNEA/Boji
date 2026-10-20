// Seated on a supported bench with one dumbbell racked at shoulder height.
// The working arm presses to lockout while the free hand stays on the hip; feet and backrest remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, seatedSingleDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-single-arm-shoulder-press', name: '哑铃单臂坐姿肩上推举', en: 'Dumbbell Single-Arm Shoulder Press',
  equipment: ["dumbbell","bench"],
  sources: ["fe:Dumbbell_One-Arm_Shoulder_Press"],
} satisfies PressInfo;

const exercise = seatedSingleDumbbellPress(info);
export default exercise satisfies SideExercise;
