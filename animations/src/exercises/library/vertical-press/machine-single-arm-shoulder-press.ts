// Sit against the machine backrest with one handle at shoulder height.
// Press one lever overhead while the free hand rests on the hip; the feet and torso stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, machinePress } from './_vertical-press-2.ts';

const info = {
  id: 'machine-single-arm-shoulder-press', name: '器械单臂肩上推举', en: 'Machine Single-Arm Shoulder Press',
  equipment: ["machine"],
  sources: ["hz:0590"],
} satisfies PressInfo;

const exercise = machinePress(info, true);
export default exercise satisfies SideExercise;
