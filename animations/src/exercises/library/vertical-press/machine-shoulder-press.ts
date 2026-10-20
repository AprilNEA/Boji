// Sit against the leverage-machine backrest with both pronated handles at shoulder height.
// Press both levers up and forward to a soft lockout; the feet and backrest contact remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, machinePress } from './_vertical-press-2.ts';

const info = {
  id: 'machine-shoulder-press', name: '器械肩上推举', en: 'Machine Shoulder Press',
  equipment: ["machine"],
  sources: ["fe:Leverage_Shoulder_Press","hz:0587","hz:0603","hz:0869","hz:2318"],
} satisfies PressInfo;

const exercise = machinePress(info);
export default exercise satisfies SideExercise;
