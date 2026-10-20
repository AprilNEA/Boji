// Rocking standing calf raise with a barbell on the upper back and soft, still knees.
// The cycle raises the heels, returns through neutral, lifts the forefeet from the heels, then returns.
// The bar stays on the upper back throughout the ankle-only movement.
import type { SideExercise } from '@/exercise.ts';
import { rockingBarbellCalves } from './_calf-raise-1.ts';

export default rockingBarbellCalves({
  id: 'barbell-rocking-standing-calf-raise', name: '杠铃站姿摇摆提踵',
  meta: {
    en: 'Barbell Rocking Standing Calf Raise', family: 'calf-raise', equipment: ['barbell'],
    sources: ['fe:Rocking_Standing_Calf_Raise'],
  },
}) satisfies SideExercise;
