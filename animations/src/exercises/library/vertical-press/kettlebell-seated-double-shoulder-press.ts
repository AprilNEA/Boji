// Sit upright on a bench with two kettlebells racked at shoulder height.
// Both bells press overhead together while the feet and backrest remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, seatedKettlebellPress } from './_vertical-press-2.ts';

const info = {
  id: 'kettlebell-seated-double-shoulder-press', name: '双壶铃坐姿肩上推举', en: 'Kettlebell Seated Double Shoulder Press',
  equipment: ["kettlebell","bench"],
  sources: ["hz:0546","hz:1438"],
} satisfies PressInfo;

const exercise = seatedKettlebellPress(info);
export default exercise satisfies SideExercise;
