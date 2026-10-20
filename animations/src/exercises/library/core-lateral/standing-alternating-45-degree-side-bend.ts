// Start tall with arms hanging by the sides and feet shoulder-width apart.
// Slide each hand toward its knee through a controlled 45-degree lateral flexion.
// The feet and pelvis remain fixed while the torso alternates sides.
import type { FrontExercise } from '@/exercise.ts';
import { standingSideBend } from './_core-lateral.ts';

const exercise = standingSideBend({
  id: 'standing-alternating-45-degree-side-bend', name: '站姿交替四十五度侧屈', en: 'Standing Alternating 45-Degree Side Bend', kind: 'bodyweight', alternating: true,
  equipment: ['bodyweight'], sources: ['hz:0002'],
});
export default exercise satisfies FrontExercise;
