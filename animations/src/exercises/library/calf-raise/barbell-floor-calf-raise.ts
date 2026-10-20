// Calf raise with both forefeet on a barbell shaft laid across the floor.
// The heels begin slightly below the shaft, rise over the balls of the feet, then lower.
// The barbell stays fixed and the knees remain straight.
import type { SideExercise } from '@/exercise.ts';
import { barbellFloorCalves } from './_calf-raise-1.ts';

export default barbellFloorCalves({
  id: 'barbell-floor-calf-raise', name: '杠铃平地提踵',
  meta: {
    en: 'Barbell Floor Calf Raise', family: 'calf-raise', equipment: ['barbell'],
    sources: ['hz:1370'],
  },
}) satisfies SideExercise;
