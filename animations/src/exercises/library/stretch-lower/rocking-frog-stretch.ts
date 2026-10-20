// Start on hands and knees with the arms planted and the knees set wide off-camera.
// The hips rock backward toward the heels, then return while both hands stay fixed on the mat.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, rockingFrog } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'rocking-frog-stretch', name: '青蛙式摇摆拉伸',
  meta: libraryMeta('Rocking Frog Stretch', ['bodyweight'], ['hz:2571']),
  muscles: [{ m: 'glutes' }, { m: 'adductors', side: 'both', scale: 0.55 }, { m: 'hamstrings', side: 'both', scale: 0.3 }],
  pose: rockingFrog,
}) satisfies SideExercise;
