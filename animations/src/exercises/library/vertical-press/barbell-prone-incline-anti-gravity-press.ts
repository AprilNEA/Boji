// Lie face down with the chest and hips supported by the incline pad.
// The bar begins near the upper chest with bent elbows, then presses horizontally forward.
// The bench and flat feet stay fixed while the arms extend and return under control.
import { antiGravityPress } from './_vertical-press-1.ts';
import type { SideExercise } from '@/exercise.ts';

const base = antiGravityPress({
  id: 'barbell-prone-incline-anti-gravity-press',
  name: '杠铃上斜俯卧抗重力推举',
  meta: { en: 'Barbell Prone Incline Anti-Gravity Press', equipment: ['barbell', 'bench'], sources: ['fe:Anti-Gravity_Press'] },
});

const exercise = {
  ...base,
  pose(t: number) {
    return {
      ...base.pose(t),
      // Each shin turns clockwise from its thigh, so both knees flex toward the back of the thigh.
      legs: { near: { a1: 25, a2: 40, foot: 0 }, far: { a1: 25, a2: 40, foot: 0 } },
    };
  },
};

export default exercise satisfies SideExercise;
