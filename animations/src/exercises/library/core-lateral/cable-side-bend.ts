// Stand tall beside a low cable and hold the single handle at the side.
// Bend laterally at the waist, lowering the handle toward the knee, then return.
// Keep both feet fixed and do not rotate the torso.
import type { FrontExercise } from '@/exercise.ts';
import { standingSideBend } from './_core-lateral.ts';

const exercise = standingSideBend({
  id: 'cable-side-bend', name: '绳索体侧屈', en: 'Cable Side Bend', kind: 'cable-low',
  equipment: ['cable'], sources: ['hz:0222'],
});
export default exercise satisfies FrontExercise;
