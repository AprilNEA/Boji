// Start upright with a close overhand grip and the bar held at the upper thighs.
// Keep the bar close while the elbows lead outward to chin height, then lower under control.
import type { FrontExercise } from '@/exercise.ts';
import { frontUprightRow } from './_shrug-upright-row.ts';

export default frontUprightRow({
  id: 'barbell-upright-row', name: '杠铃直立划船', en: 'Barbell Upright Row',
  equipment: ['barbell'],
  sources: ['fe:Upright_Barbell_Row', 'hz:0120', 'hz:0119', 'hz:0121'], implement: 'barbell',
}) satisfies FrontExercise;
