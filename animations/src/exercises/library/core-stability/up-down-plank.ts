// Start in a high plank with a straight line from shoulders to heels.
// Lower one arm at a time onto the forearms, then press back to the palms in order.
// Keep the feet planted and avoid rotating or dropping the hips during each transition.
import type { SideExercise } from '@/exercise.ts';
import { upDownPlankPose } from './_core-stability-2.ts';

export default {
  id: 'up-down-plank',
  name: '平板支撑交替上下撑',
  tl: { total: 4 },
  mat: true,
  meta: { en: 'Up-Down Plank', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3665'] },
  muscles: [
    { m: 'abs', e: () => 0.9 }, { m: 'glutes', e: () => 0.54 },
    { m: 'delts', side: 'both', scale: 0.55, e: () => 0.67 },
    { m: 'triceps', side: 'both', scale: 0.48, e: () => 0.7 },
  ],
  poster: 0.5,
  pose: upDownPlankPose,
} satisfies SideExercise;
