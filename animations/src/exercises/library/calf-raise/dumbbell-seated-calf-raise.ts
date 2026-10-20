// Seated calf raise with a dumbbell across the thighs and both forefeet on a block.
// The forefeet stay supported while both heels lower into a stretch and rise together.
// The bench, block, and dumbbell position remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { seatedCalves } from './_calf-raise-1.ts';

export default seatedCalves({
  id: 'dumbbell-seated-calf-raise', name: '哑铃坐姿提踵',
  meta: {
    en: 'Dumbbell Seated Calf Raise', family: 'calf-raise', equipment: ['dumbbell', 'bench', 'step'],
    sources: ['hz:1379'],
  },
  load: 'dumbbell',
}) satisfies SideExercise;
