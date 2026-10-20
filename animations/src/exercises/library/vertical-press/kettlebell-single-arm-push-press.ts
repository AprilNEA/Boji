// Stand with one kettlebell racked at shoulder height and the free hand on the hip.
// Dip once and drive the bell to overhead lockout without a second knee dip; feet stay planted.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, kettlebellPushPress } from './_vertical-press-2.ts';

const info = {
  id: 'kettlebell-single-arm-push-press', name: '壶铃单臂借力推举', en: 'Kettlebell Single-Arm Push Press',
  equipment: ["kettlebell"],
  sources: ["fe:One-Arm_Kettlebell_Push_Press","hz:0540"],
} satisfies PressInfo;

const exercise = kettlebellPushPress(info, true);
export default exercise satisfies SideExercise;
