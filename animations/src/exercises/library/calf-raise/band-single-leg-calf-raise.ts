// Single-leg calf raise with a loop band around the working forefoot and one hand on a wall.
// The working ball stays planted while the heel and body rise together; the other leg stays lifted.
// The wall hand remains fixed for balance.
import type { SideExercise } from '@/exercise.ts';
import { standingCalves } from './_calf-raise-1.ts';

export default standingCalves({
  id: 'band-single-leg-calf-raise', name: '弹力带单腿提踵',
  meta: {
    en: 'Band Single-Leg Calf Raise', family: 'calf-raise', equipment: ['band', 'wall'],
    sources: ['hz:0999'],
  },
  single: true, arms: 'wall', footBand: true,
}) satisfies SideExercise;
