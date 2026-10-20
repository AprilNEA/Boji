// Single-leg floor calf raise with the working foot planted and both hands on a wall.
// The heel lifts over the ball of the working foot while the free leg remains off the floor.
// The wall contact remains fixed for balance.
import type { SideExercise } from '@/exercise.ts';
import { standingCalves } from './_calf-raise-1.ts';

export default standingCalves({
  id: 'single-leg-floor-calf-raise', name: '单腿平地提踵',
  meta: {
    en: 'Single-Leg Floor Calf Raise', family: 'calf-raise', equipment: ['bodyweight', 'wall'],
    sources: ['hz:1387'],
  },
  single: true, arms: 'wall',
}) satisfies SideExercise;
