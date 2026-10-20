// Sit with the palms beside the hips and the shoulders stacked over the hands.
// Press into the floor to lift the hips and keep both straight legs parallel to the mat.
import type { SideExercise } from '@/exercise.ts';
import { FLOOR } from '@/exercises/common.ts';

const lift = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * 2 * t);

export default {
  id: 'floor-l-sit',
  name: '地板直角支撑',
  tl: { total: 4 },
  mat: true,
  meta: { en: 'Floor L-Sit', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3419'] },
  muscles: [{ m: 'abs', e: () => 0.92 }, { m: 'hipFlexor', side: 'both', scale: 0.65, e: () => 0.8 }, { m: 'triceps', side: 'both', scale: 0.3, e: () => 0.45 }],
  // The high hold, not the seated transition, is the recognizable L-sit still.
  poster: 0.5,
  pose(t) {
    const q = lift(t);
    // The palms stay on the mat. The eleven-pixel lift clears both the seat and legs while leaving the elbows nearly locked.
    const hip: [number, number] = [220, FLOOR - 16 - 11 * q];
    return {
      hip, spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90, farHip: 0, farShoulder: 0,
      legs: {
        near: { a1: 0, a2: 0, foot: 0 }, far: { a1: 0, a2: 0, foot: 0 },
      },
      arms: {
        near: { target: (J) => [J.S[0], FLOOR - 7], side: [-1, 0], hand: 90 },
        far: { target: (J) => [J.Sf[0], FLOOR - 7], side: [-1, 0], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
