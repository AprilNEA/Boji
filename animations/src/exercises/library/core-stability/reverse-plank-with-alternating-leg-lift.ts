// Support the diagonal reverse plank on the palms and both heels.
// Keep the hips lifted while one straight leg reaches toward the ceiling, then alternate.
// The shoulders, glutes and braced trunk stay firm as each raised leg returns.
import type { SideExercise } from '@/exercise.ts';
import { reversePlankLegLiftPose } from './_core-stability-2.ts';

export default {
  id: 'reverse-plank-with-alternating-leg-lift',
  name: '反向平板支撑交替抬腿',
  tl: { total: 4 },
  mat: true,
  meta: { en: 'Reverse Plank with Alternating Leg Lift', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3663'] },
  muscles: [
    { m: 'abs', e: () => 0.82 }, { m: 'glutes', e: () => 0.78 },
    { m: 'hamstrings', side: 'both', scale: 0.55, e: () => 0.65 },
    { m: 'delts', side: 'both', scale: 0.38, e: () => 0.48 },
  ],
  poster: 0.25,
  pose: reversePlankLegLiftPose,
} satisfies SideExercise;
