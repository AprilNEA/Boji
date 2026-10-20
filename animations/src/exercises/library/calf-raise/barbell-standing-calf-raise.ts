// Standing calf raise with a barbell carried across the upper back.
// Both balls of the feet remain on the floor while the heels and body rise together.
// The knees stay softly straight and the bar remains on the upper back.
import type { SideExercise } from '@/exercise.ts';
import { standingCalves } from './_calf-raise-1.ts';

export default standingCalves({
  id: 'barbell-standing-calf-raise', name: '杠铃站姿提踵',
  meta: {
    en: 'Barbell Standing Calf Raise', family: 'calf-raise', equipment: ['barbell'],
    sources: ['fe:Standing_Barbell_Calf_Raise', 'hz:1372', 'hz:0108', 'hz:0111'],
  },
  arms: 'barbell',
}) satisfies SideExercise;
