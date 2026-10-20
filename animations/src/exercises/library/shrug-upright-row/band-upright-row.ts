// Stand on the band with its ends at the upper thighs and a narrow overhand hand position.
// Pull the ends toward the chin by driving both elbows outward and higher than the forearms.
import type { FrontExercise } from '@/exercise.ts';
import { frontUprightRow } from './_shrug-upright-row.ts';

export default frontUprightRow({
  id: 'band-upright-row', name: '弹力带直立划船', en: 'Band Upright Row',
  equipment: ['band'], sources: ['fe:Upright_Row_-_With_Bands'], implement: 'band',
}) satisfies FrontExercise;
