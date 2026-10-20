// Stand beside an anchored landmine with one hand holding the loaded bar near shoulder height.
// Dip once and drive the bar along its anchored arc to lockout; the free hand stays on the hip.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, landminePushPress } from './_vertical-press-2.ts';

const info = {
  id: 'landmine-single-arm-push-press', name: '地雷杆单臂借力推举', en: 'Landmine Single-Arm Push Press',
  equipment: ["landmine"],
  sources: ["fe:Single-Arm_Linear_Jammer"],
} satisfies PressInfo;

const exercise = landminePushPress(info);
export default exercise satisfies SideExercise;
