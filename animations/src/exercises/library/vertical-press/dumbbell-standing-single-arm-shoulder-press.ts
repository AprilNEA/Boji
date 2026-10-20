// Stand tall with one pronated dumbbell racked at shoulder height.
// The working arm presses overhead while the free hand rests at the hip; the feet and torso stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, standingDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-standing-single-arm-shoulder-press', name: '哑铃站姿单臂肩上推举', en: 'Dumbbell Standing Single-Arm Shoulder Press',
  equipment: ["dumbbell"],
  sources: ["hz:0361","hz:0360"],
} satisfies PressInfo;

const exercise = standingDumbbellPress(info, { single: true });
export default exercise satisfies SideExercise;
