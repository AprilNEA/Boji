// Stand tall with two kettlebells racked at the shoulders.
// Dip once, drive both bells to lockout, then return to the rack; the feet remain planted.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, kettlebellPushPress } from './_vertical-press-2.ts';

const info = {
  id: 'kettlebell-double-push-press', name: '双壶铃借力推举', en: 'Kettlebell Double Push Press',
  equipment: ["kettlebell"],
  sources: ["fe:Double_Kettlebell_Push_Press","hz:0528"],
} satisfies PressInfo;

const exercise = kettlebellPushPress(info);
export default exercise satisfies SideExercise;
