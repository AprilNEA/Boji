// Seated single-leg calf raise with a dumbbell held over the working thigh.
// The working forefoot stays on the block as its heel lifts and returns below the step.
// The opposite foot remains on the floor and the bench stays fixed.
import type { SideExercise } from '@/exercise.ts';
import { seatedCalves } from './_calf-raise-1.ts';

export default seatedCalves({
  id: 'dumbbell-seated-single-leg-calf-raise', name: '哑铃坐姿单腿提踵',
  meta: {
    en: 'Dumbbell Seated Single-Leg Calf Raise', family: 'calf-raise', equipment: ['dumbbell', 'bench', 'step'],
    sources: ['fe:Dumbbell_Seated_One-Leg_Calf_Raise', 'hz:0400'],
  },
  single: true, load: 'dumbbell',
}) satisfies SideExercise;
