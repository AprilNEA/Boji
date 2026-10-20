// Seated single-leg calf raise with a vertically held dumbbell on the working thigh.
// The supported forefoot stays on the block while the heel moves through the calf-raise range.
// The neutral hammer grip, bench, and free foot position stay unchanged.
import type { SideExercise } from '@/exercise.ts';
import { seatedCalves } from './_calf-raise-1.ts';

export default seatedCalves({
  id: 'dumbbell-seated-single-leg-calf-raise-with-hammer-grip', name: '哑铃坐姿单腿提踵锤式握法',
  meta: {
    en: 'Dumbbell Seated Single-Leg Calf Raise with Hammer Grip', family: 'calf-raise', equipment: ['dumbbell', 'bench', 'step'],
    sources: ['hz:1380'],
  },
  single: true, load: 'hammer',
}) satisfies SideExercise;
