// Begin low over the palms, then draw the knees toward the bent upper arms.
// The palms remain fixed on the mat while the feet tuck clear of the floor.
// The balance position holds a straight, level torso without letting the elbows collapse inward.
import type { SideExercise } from '@/exercise.ts';
import { workTL } from '@/exercises/equipment/index.ts';
import { frogStandPose } from './_core-stability-2.ts';

const tl = workTL(0.8);

export default {
  id: 'frog-stand',
  name: '蛙式支撑',
  tl,
  mat: true,
  meta: { en: 'Frog Stand', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3301'] },
  muscles: [
    { m: 'abs' }, { m: 'delts', side: 'both', scale: 0.65 },
    { m: 'triceps', side: 'both', scale: 0.55 }, { m: 'pecs', scale: 0.35 },
  ],
  poster: 0.34,
  pose: (t) => frogStandPose(tl.at(t).p),
} satisfies SideExercise;
