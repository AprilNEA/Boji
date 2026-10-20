// Stand tall with two kettlebells racked at the shoulders.
// One bell rises as the other lowers in a continuous seesaw; the feet and torso stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, alternatingKettlebellPress } from './_vertical-press-2.ts';

const info = {
  id: 'kettlebell-seesaw-press', name: '壶铃交替肩上推举', en: 'Kettlebell Seesaw Press',
  equipment: ["kettlebell"],
  sources: ["fe:Kettlebell_Seesaw_Press","hz:0547"],
} satisfies PressInfo;

const exercise = alternatingKettlebellPress(info, true);
export default exercise satisfies SideExercise;
