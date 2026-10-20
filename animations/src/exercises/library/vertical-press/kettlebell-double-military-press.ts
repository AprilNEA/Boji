// Stand tall with two kettlebells racked at shoulder height.
// Both bells press overhead without leg drive; the feet stay planted and the torso stays vertical.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, standingKettlebellPress } from './_vertical-press-2.ts';

const info = {
  id: 'kettlebell-double-military-press', name: '双壶铃严格推举', en: 'Kettlebell Double Military Press',
  equipment: ["kettlebell"],
  sources: ["fe:Two-Arm_Kettlebell_Military_Press","hz:0553"],
} satisfies PressInfo;

const exercise = standingKettlebellPress(info);
export default exercise satisfies SideExercise;
