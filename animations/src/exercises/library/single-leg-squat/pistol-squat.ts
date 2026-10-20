// Pistol squat, side view. The near foot is the only grounded foot and the far leg stays level in front.
// The hips sit back as the support knee bends to about 86 degrees at the bottom.
// Forward arms counterbalance the descent, then the planted heel drives the figure back to standing.
import type { SideExercise } from '@/exercise.ts';
import { pistolPose, pistolTL } from './_single-leg-squat.ts';

export default {
  id: 'pistol-squat',
  name: '手枪式深蹲',
  tl: pistolTL,
  meta: { en: 'Pistol Squat', family: 'single-leg-squat', equipment: ['bodyweight'], sources: ['hz:1476'] },
  muscles: [
    { m: 'glutes' }, { m: 'quads', side: 'near', scale: 0.7 },
    { m: 'hamstrings', side: 'near', scale: 0.4 }, { m: 'calves', side: 'near', scale: 0.3 },
  ],
  pose: (t) => pistolPose(t, 'forward'),
} satisfies SideExercise;
