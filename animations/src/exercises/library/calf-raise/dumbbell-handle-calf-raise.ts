// Single-leg calf raise with the working forefoot balanced on a dumbbell handle.
// The heel rolls from a below-handle stretch to plantar flexion while the free leg stays lifted.
// Both hands keep a light, fixed contact with the wall for balance.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellHandleCalves } from './_calf-raise-1.ts';

export default dumbbellHandleCalves({
  id: 'dumbbell-handle-calf-raise', name: '哑铃柄上提踵',
  meta: {
    en: 'Dumbbell Handle Calf Raise', family: 'calf-raise', equipment: ['dumbbell', 'wall'],
    sources: ['fe:Calf_Raise_On_A_Dumbbell'],
  },
}) satisfies SideExercise;
