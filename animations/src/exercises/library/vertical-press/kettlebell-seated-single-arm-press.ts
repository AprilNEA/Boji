// Sit on the floor with the legs spread and one kettlebell racked at the shoulder.
// Press the bell overhead while the free hand rests at the hip and the seated base stays fixed.
import type { SideExercise } from '@/exercise.ts';
import { type PressInfo, floorKettlebellPress } from './_vertical-press-2.ts';

const info = {
  id: 'kettlebell-seated-single-arm-press', name: '壶铃地板坐姿单臂推举', en: 'Kettlebell Seated Single-Arm Press',
  equipment: ["kettlebell","mat"],
  sources: ["fe:Kettlebell_Seated_Press"],
} satisfies PressInfo;

const base = floorKettlebellPress(info);
const exercise = {
  ...base,
  pose(t: number) {
    return {
      ...base.pose(t),
      // The extended floor-seated legs slope toward their flat feet without either knee reversing.
      legs: { near: { a1: 5, a2: 9, foot: 0 }, far: { a1: 5, a2: 9, foot: 0 } },
    };
  },
};
export default exercise satisfies SideExercise;
