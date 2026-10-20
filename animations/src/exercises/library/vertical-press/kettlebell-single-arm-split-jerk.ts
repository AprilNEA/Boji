// Stand with one kettlebell racked at shoulder height and the free hand on the hip.
// Dip and drive, then catch the locked-out bell in a split stance before returning to standing.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, kettlebellJerk } from './_vertical-press-2.ts';

const info = {
  id: 'kettlebell-single-arm-split-jerk', name: '壶铃单臂分腿挺举', en: 'Kettlebell Single-Arm Split Jerk',
  equipment: ["kettlebell"],
  sources: ["fe:One-Arm_Kettlebell_Split_Jerk"],
} satisfies PressInfo;

const exercise = kettlebellJerk(info, true);
export default exercise satisfies SideExercise;
