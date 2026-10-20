// Lie on the back with knees bent and hands beside the head.
// Lift the shoulder blades in a controlled crunch, alternating the oblique emphasis.
// The lower back, pelvis and flat feet remain fixed on the floor.
import type { SideExercise } from '@/exercise.ts';
import { supineObliqueCrunch } from './_core-lateral.ts';

const exercise = supineObliqueCrunch({
  id: 'alternating-oblique-crunch', name: '交替斜向卷腹', en: 'Alternating Oblique Crunch',
  sources: ['hz:1495', 'hz:0635'],
});
export default exercise satisfies SideExercise;
