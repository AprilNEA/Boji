// Stand sideways to a low cable with knees soft and the free hand on the hip.
// Bring the loaded-side elbow down toward the hip through lateral trunk flexion.
// Keep the cable taut and the feet planted.
import type { FrontExercise } from '@/exercise.ts';
import { standingSideBend } from './_core-lateral.ts';

const exercise = standingSideBend({
  id: 'cable-standing-side-crunch', name: '绳索站姿侧卷腹', en: 'Cable Standing Side Crunch', kind: 'cable-low',
  equipment: ['cable'], cableMode: 'crunch', sources: ['hz:0223'],
});
export default exercise satisfies FrontExercise;
