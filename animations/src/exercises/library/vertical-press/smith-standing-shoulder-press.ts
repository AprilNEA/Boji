// Stand under the Smith rails with the bar at the lower front-shoulder rail position.
// Press the bar vertically overhead to a soft lockout; the feet remain planted and torso stays upright.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, smithPress } from './_vertical-press-2.ts';

const info = {
  id: 'smith-standing-shoulder-press', name: '史密斯站姿肩上推举', en: 'Smith Standing Shoulder Press',
  equipment: ["smith"],
  sources: ["hz:0774"],
} satisfies PressInfo;

const exercise = smithPress(info, { standing: true });
export default exercise satisfies SideExercise;
