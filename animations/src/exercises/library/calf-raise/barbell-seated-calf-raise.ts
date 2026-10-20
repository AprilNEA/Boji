// Seated calf raise with a barbell across the upper thighs and both forefeet on a block.
// The forefeet stay on the block while the heels rise and lower through a controlled ankle range.
// The bench, block, and barbell load stay aligned with the thighs.
import type { SideExercise } from '@/exercise.ts';
import { seatedCalves } from './_calf-raise-1.ts';

export default seatedCalves({
  id: 'barbell-seated-calf-raise', name: '杠铃坐姿提踵',
  meta: {
    en: 'Barbell Seated Calf Raise', family: 'calf-raise', equipment: ['barbell', 'bench', 'step'],
    sources: ['fe:Barbell_Seated_Calf_Raise', 'hz:0088', 'hz:1371'],
  },
  load: 'barbell',
}) satisfies SideExercise;
