// Stand on the band with straight arms and relaxed shoulders.
// Raise both shoulder joints vertically, then lower them without bending the elbows or moving the torso.
import type { FrontExercise } from '@/exercise.ts';
import { frontShrug } from './_shrug-upright-row.ts';

export default frontShrug({
  id: 'band-shrug', name: '弹力带耸肩', en: 'Band Shrug',
  equipment: ['band'], sources: ['hz:1018'], implement: 'band',
}) satisfies FrontExercise;
