// Seated upright with one dumbbell racked and its palm facing the torso.
// The working arm presses overhead while the free hand stays on the hip; feet stay flat.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, seatedSingleDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-single-arm-seated-reverse-grip-shoulder-press', name: '哑铃单臂坐姿反握肩上推举', en: 'Dumbbell Single-Arm Seated Reverse-Grip Shoulder Press',
  equipment: ["dumbbell","bench"],
  sources: ["hz:1622"],
} satisfies PressInfo;

const exercise = seatedSingleDumbbellPress(info, { reverse: true });
export default exercise satisfies SideExercise;
