// Kneel on the machine pads with the hips over the knees and both hands holding the stabilizing handles.
// Keep the lower body fixed while twisting the torso alternately to each side.
// The knees remain supported and the handles stay fixed for controlled rotation.
import type { FrontExercise } from '@/exercise.ts';
import { kneeling, kneelingStationProps } from './_core-rotation-2.ts';

const twist = (t: number) => Math.sin(Math.PI * 2 * t);
export default {
  id: 'machine-kneeling-torso-twist', name: '器械跪姿转体', view: 'front', tl: { total: 3.4 },
  meta: { en: 'Machine Kneeling Torso Twist', family: 'core-rotation', equipment: ['machine'], sources: ['hz:0583'] },
  muscles: [{ m: 'abs', e: () => 0.85 }, { m: 'obliques', scale: 0.78, e: () => 0.82 }],
  props: kneelingStationProps, propsBox: [-124, 124],
  poster: 0.25,
  pose(t) {
    const u = twist(t);
    return {
      ...kneeling(34 * u),
      arms: {
        l: { target: [54, 214, 24], pole: [42, -12, 30] },
        r: { target: [-54, 214, 24], pole: [-42, -12, 30] },
      },
    };
  },
} satisfies FrontExercise;
