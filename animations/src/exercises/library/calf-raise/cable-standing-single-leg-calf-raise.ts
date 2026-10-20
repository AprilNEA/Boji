// Single-leg calf raise while holding the cable column for balance.
// The working ball stays planted while the heel rises; the other leg stays lifted.
// Both hands remain on the fixed column support.
import type { SideExercise } from '@/exercise.ts';
import { cableStandingCalves } from './_calf-raise-1.ts';

export default cableStandingCalves({
  id: 'cable-standing-single-leg-calf-raise', name: '绳索站姿单腿提踵',
  meta: {
    en: 'Cable Standing Single-Leg Calf Raise', family: 'calf-raise', equipment: ['cable'],
    sources: ['hz:1376'],
  },
}, true) satisfies SideExercise;
