// Sit on the floor with the legs spread and one kettlebell racked at the shoulder.
// Press the bell overhead while the free hand rests at the hip and the seated base stays fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, floorKettlebellPress } from './_vertical-press-2.ts';

const info = {
  id: 'kettlebell-seated-single-arm-press', name: '壶铃地板坐姿单臂推举', en: 'Kettlebell Seated Single-Arm Press',
  equipment: ["kettlebell","mat"],
  sources: ["fe:Kettlebell_Seated_Press"],
} satisfies PressInfo;

const exercise = floorKettlebellPress(info);
export default exercise satisfies SideExercise;
