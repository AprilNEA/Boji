// Seated single-leg calf raise with a palm-up hand stabilizing a dumbbell on the thigh.
// The working forefoot remains on the block while its heel rises and lowers under control.
// The free leg stays extended off the floor and the bench remains fixed.
import type { SideExercise } from '@/exercise.ts';
import { seatedCalves } from './_calf-raise-1.ts';

export default seatedCalves({
  id: 'dumbbell-seated-single-leg-calf-raise-with-underhand-grip', name: '哑铃坐姿单腿提踵反握',
  meta: {
    en: 'Dumbbell Seated Single-Leg Calf Raise with Underhand Grip', family: 'calf-raise', equipment: ['dumbbell', 'bench', 'step'],
    sources: ['hz:1381'],
  },
  single: true, load: 'underhand', extendedFreeLeg: true,
}) satisfies SideExercise;
