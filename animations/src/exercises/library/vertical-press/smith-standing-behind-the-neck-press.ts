// Stand under the Smith rails with the bar behind the head and the elbows bent.
// Press the bar vertically to lockout behind the head; the feet remain planted and torso stays upright.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, smithPress } from './_vertical-press-2.ts';

const info = {
  id: 'smith-standing-behind-the-neck-press', name: '史密斯站姿颈后推举', en: 'Smith Standing Behind-the-Neck Press',
  equipment: ["smith"],
  sources: ["hz:0747","hz:0772"],
} satisfies PressInfo;

const exercise = smithPress(info, { standing: true, behindNeck: true });
export default exercise satisfies SideExercise;
