// Sit against the machine backrest with both handles at shoulder height.
// Press both levers overhead to a soft lockout; the feet and backrest contact remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, machinePress } from './_vertical-press-2.ts';

const info = {
  id: 'machine-seated-shoulder-press', name: '器械坐姿肩上推举', en: 'Machine Seated Shoulder Press',
  equipment: ["machine"],
  sources: ["fe:Machine_Shoulder_Military_Press"],
} satisfies PressInfo;

const exercise = machinePress(info);
export default exercise satisfies SideExercise;
