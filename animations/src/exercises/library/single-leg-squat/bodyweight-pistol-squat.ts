// Bodyweight pistol squat, side view. The near heel stays flat while the far leg remains straight and off the floor.
// Both arms stay extended forward for balance as the hips travel back and down.
// The torso remains neutral and the support knee and hip extend together on the return.
import type { SideExercise } from '@/exercise.ts';
import { pistolPose, pistolTL } from './_single-leg-squat.ts';

export default {
  id: 'bodyweight-pistol-squat',
  name: '自重手枪深蹲',
  tl: pistolTL,
  meta: { en: 'Bodyweight Pistol Squat', family: 'single-leg-squat', equipment: ['bodyweight'], sources: ['hz:1759'] },
  muscles: [
    { m: 'glutes' }, { m: 'quads', side: 'near', scale: 0.7 },
    { m: 'hamstrings', side: 'near', scale: 0.4 }, { m: 'calves', side: 'near', scale: 0.3 },
  ],
  pose: (t) => pistolPose(t, 'forward'),
} satisfies SideExercise;
