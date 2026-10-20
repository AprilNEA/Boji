// Standing calf raise facing a cable column with both D-handles held in front of the torso.
// Both forefeet stay planted while the heels rise; the two cable lines remain connected to the handles.
// The cable column stays fixed and the knees remain straight.
import type { SideExercise } from '@/exercise.ts';
import { cableStandingCalves } from './_calf-raise-1.ts';

export default cableStandingCalves({
  id: 'cable-standing-calf-raise', name: '绳索站姿提踵',
  meta: {
    en: 'Cable Standing Calf Raise', family: 'calf-raise', equipment: ['cable'],
    sources: ['hz:1375'],
  },
}, false) satisfies SideExercise;
