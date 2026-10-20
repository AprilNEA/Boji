// Sit upright against a bench with the Smith bar held at the lower rail position.
// Press the bar vertically overhead to a soft lockout; the feet and backrest contact stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, smithPress } from './_vertical-press-2.ts';

const info = {
  id: 'smith-seated-shoulder-press', name: '史密斯坐姿肩上推举', en: 'Smith Seated Shoulder Press',
  equipment: ["smith","bench"],
  sources: ["hz:0765","hz:0766"],
} satisfies PressInfo;

const exercise = smithPress(info);
export default exercise satisfies SideExercise;
