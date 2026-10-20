// Stand square facing a chest-height cable station with the feet planted.
// Pull the pronated straight bar into the upper chest and keep the torso upright throughout.
import type { SideExercise } from '@/exercise.ts';
import { standingCableRow } from './_horizontal-row-2.ts';

export default standingCableRow({
  id: 'cable-standing-high-row', name: '站姿高位绳索划船', en: 'Cable Standing High Row',
  equipment: ['cable'], sources: ['hz:1324'], handle: 'straight', high: true,
}) satisfies SideExercise;
