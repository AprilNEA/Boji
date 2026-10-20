// 哑铃坐姿斯科特推举, side view. The dumbbells travel in a short overhead arc without elbow lockout.
// The torso stays against the backrest, the feet stay flat, and both hands retain the dumbbells.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, seatedDumbbellPress } from './_vertical-press-2.ts';

const info = {
  id: 'dumbbell-seated-scott-press', name: '哑铃坐姿肩上推举', en: 'Dumbbell Seated Scott Press',
  equipment: ["dumbbell","bench"],
  sources: ["hz:2397"],
} satisfies PressInfo;

const exercise = seatedDumbbellPress(info, false, 0.82);
export default exercise satisfies SideExercise;
