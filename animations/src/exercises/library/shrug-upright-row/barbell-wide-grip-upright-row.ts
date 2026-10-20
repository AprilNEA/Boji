// Start upright with a visibly wide overhand grip and the bar at the upper thighs.
// Drive the elbows outward and upward toward the chin while the torso remains tall and still.
import type { FrontExercise } from '@/exercise.ts';
import { frontUprightRow } from './_shrug-upright-row.ts';

export default frontUprightRow({
  id: 'barbell-wide-grip-upright-row', name: '杠铃宽握直立划船', en: 'Barbell Wide-Grip Upright Row',
  equipment: ['barbell'], sources: ['hz:0123'], implement: 'barbell', wide: true,
}) satisfies FrontExercise;
