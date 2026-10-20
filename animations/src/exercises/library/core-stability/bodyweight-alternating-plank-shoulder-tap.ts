// Hold a high plank with both feet and the supporting hand fixed on the mat.
// One hand reaches across to the opposite shoulder, returns, then the other hand repeats.
import type { SideExercise } from '@/exercise.ts';
import { shoulderTapPose } from './_core-stability-1.ts';

export default {
  id: 'bodyweight-alternating-plank-shoulder-tap',
  name: '平板支撑交替触肩',
  tl: { total: 4 },
  mat: true,
  meta: { en: 'Bodyweight Alternating Plank Shoulder Tap', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3699', 'hz:3239'] },
  muscles: [
    { m: 'abs', e: () => 0.9 }, { m: 'delts', side: 'both', scale: 0.55, e: () => 0.72 },
    { m: 'triceps', side: 'both', scale: 0.45, e: () => 0.55 },
  ],
  poster: 0.125,
  pose: shoulderTapPose,
} satisfies SideExercise;
