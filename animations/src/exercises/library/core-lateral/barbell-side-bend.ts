// Start tall with a bar resting across the upper back and both hands steadying it.
// Laterally flex the trunk right, then return upright without turning the torso.
// Both soles stay flat and the knees stay extended.
import type { FrontExercise } from '@/exercise.ts';
import { standingSideBend } from './_core-lateral.ts';

const exercise = standingSideBend({
  id: 'barbell-side-bend', name: '杠铃体侧屈', en: 'Barbell Side Bend', kind: 'barbell',
  equipment: ['barbell'], sources: ['fe:Barbell_Side_Bend', 'hz:0096'],
});
export default exercise satisfies FrontExercise;
