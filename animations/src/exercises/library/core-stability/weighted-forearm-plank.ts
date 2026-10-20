// Brace on the forearms and toes with each elbow directly below its shoulder.
// Secure a plate over the upper back and hold the body in one straight line.
// Keep the hips level rather than letting the added load pull the lower back down.
import type { SideExercise } from '@/exercise.ts';
import { heldPlate } from '@/exercises/equipment/index.ts';
import { FOREARM_PLANK_2, holdWave } from './_core-stability-2.ts';

export default {
  id: 'weighted-forearm-plank',
  name: '负重前臂平板支撑',
  tl: { total: 4 },
  mat: true,
  meta: { en: 'Weighted Forearm Plank', family: 'core-stability', equipment: ['bodyweight', 'plate'], sources: ['hz:2135'] },
  muscles: [
    { m: 'abs', e: (t) => 0.82 + 0.1 * holdWave(t) }, { m: 'lowerBack', scale: 0.35, e: () => 0.44 },
    { m: 'delts', side: 'both', scale: 0.42, e: () => 0.5 },
  ],
  dynamic: [heldPlate((J) => ({ p: J.B(0.7), a: 0 }), 'face', 'medium', 'front', 'Back Plate')],
  poster: 0.25,
  pose: (t) => ({ ...FOREARM_PLANK_2.body(holdWave(t)), arms: FOREARM_PLANK_2.arms }),
} satisfies SideExercise;
