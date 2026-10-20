// Standing bodyweight calf raise with both hands on a wall for light balance support.
// Both balls stay on the floor while the heels and body lift, then lower under control.
// The knees stay straight and the wall hand stays fixed.
import type { SideExercise } from '@/exercise.ts';
import { standingCalves } from './_calf-raise-1.ts';

export default standingCalves({
  id: 'bodyweight-standing-calf-raise', name: '自重站姿提踵',
  meta: {
    en: 'Bodyweight Standing Calf Raise', family: 'calf-raise', equipment: ['bodyweight', 'wall'],
    sources: ['hz:1373', 'hz:1397'],
  },
  arms: 'wall',
}) satisfies SideExercise;
