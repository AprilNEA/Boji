// Face the low pulley with a narrow straight-bar attachment at the upper thighs.
// Pull the attachment close to the body toward the chin, with elbows leading above the forearms.
import type { FrontExercise } from '@/exercise.ts';
import { frontCableUprightRow } from './_shrug-upright-row.ts';

export default frontCableUprightRow({
  id: 'cable-upright-row', name: '绳索直立划船', en: 'Cable Upright Row', sources: ['fe:Upright_Cable_Row', 'hz:0246'],
}) satisfies FrontExercise;
