// Stand tall with one neutral-grip dumbbell racked at shoulder height.
// The working arm presses overhead while the free hand stabilizes at the hip; the torso stays vertical.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, standingDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-standing-single-arm-neutral-grip-shoulder-press', name: '哑铃站姿单臂对握肩上推举', en: 'Dumbbell Standing Single-Arm Neutral-Grip Shoulder Press',
  equipment: ["dumbbell"],
  sources: ["fe:Standing_Palm-In_One-Arm_Dumbbell_Press","hz:0424"],
} satisfies PressInfo;

const exercise = standingDumbbellPress(info, { neutral: true, single: true });
export default exercise satisfies SideExercise;
