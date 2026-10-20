// Single-leg calf raise with the working forefoot on a secured dumbbell handle.
// The held dumbbell stays at the side while the free hand keeps a fixed wall contact.
// The working heel rolls through a stretch and full plantar-flexed top position.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellOnHandleCalves } from './_calf-raise-1.ts';

export default dumbbellOnHandleCalves({
  id: 'dumbbell-single-leg-calf-raise-on-dumbbell', name: '哑铃垫脚单腿提踵',
  meta: {
    en: 'Dumbbell Single-Leg Calf Raise on Dumbbell', family: 'calf-raise', equipment: ['dumbbell', 'wall'],
    sources: ['hz:0727'],
  },
}) satisfies SideExercise;
