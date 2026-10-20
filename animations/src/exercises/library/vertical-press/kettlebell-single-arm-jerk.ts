// Stand with one kettlebell racked at shoulder height and the free hand on the hip.
// Dip and drive, then catch the locked-out bell in a shallow squat before standing tall.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, kettlebellJerk } from './_vertical-press-2.ts';

const info = {
  id: 'kettlebell-single-arm-jerk', name: '壶铃单臂借力挺举', en: 'Kettlebell Single-Arm Jerk',
  equipment: ["kettlebell"],
  sources: ["fe:One-Arm_Kettlebell_Jerk","hz:0538"],
} satisfies PressInfo;

const exercise = kettlebellJerk(info);
export default exercise satisfies SideExercise;
