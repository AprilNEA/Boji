// Standing band calf raise with both forefeet on the band and the handles at shoulder height.
// The balls of the feet stay down while both heels rise; the elbows remain bent beside the torso.
// The band stays taut from the forefeet to the hands.
import type { SideExercise } from '@/exercise.ts';
import { standingCalves } from './_calf-raise-1.ts';

export default standingCalves({
  id: 'band-standing-calf-raise', name: '弹力带站姿提踵',
  meta: {
    en: 'Band Standing Calf Raise', family: 'calf-raise', equipment: ['band'],
    sources: ['fe:Calf_Raises_-_With_Bands', 'hz:1369'],
  },
  arms: 'band',
}) satisfies SideExercise;
