// High-bar single-leg squat, side view. The near heel stays planted while the far leg remains straight forward.
// The bar stays across the upper back as the hips sit back to a near-parallel working thigh.
// The chest stays lifted with a neutral spine; the squat returns through the same controlled path.
import type { SideExercise } from '@/exercise.ts';
import { add } from '@/math.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { pistolPose, pistolTL } from './_single-leg-squat.ts';

export default {
  id: 'barbell-pistol-squat',
  name: '杠铃手枪深蹲',
  tl: pistolTL,
  meta: { en: 'Barbell Pistol Squat', family: 'single-leg-squat', equipment: ['barbell'], sources: ['hz:0068'] },
  muscles: [
    { m: 'quads', side: 'near' }, { m: 'glutes', scale: 0.6 },
    { m: 'hamstrings', side: 'near', scale: 0.4 }, { m: 'calves', side: 'near', scale: 0.35 },
  ],
  dynamic: [barbell({ view: 'side', plate: 'medium', z: 'underNearArm', at: (J) => ({ p: add(J.B(0.88), [-22, 2]) }) })],
  pose: (t) => pistolPose(t, 'back-bar'),
} satisfies SideExercise;
