// Face the low pulley with a straight bar held in front and both elbows nearly straight.
// Raise the shoulders to lift the bar, then lower while the cable stays connected to the low pulley.
import type { FrontExercise } from '@/exercise.ts';
import { frontCableShrug } from './_shrug-upright-row.ts';

export default frontCableShrug({
  id: 'cable-shrug', name: '绳索耸肩', en: 'Cable Shrug', sources: ['fe:Cable_Shrugs', 'hz:0220'],
}) satisfies FrontExercise;
