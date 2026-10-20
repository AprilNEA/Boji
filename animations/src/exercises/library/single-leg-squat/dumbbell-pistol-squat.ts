// Dumbbell pistol squat, side view. The near heel remains planted and the far leg stays straight forward off the floor.
// A dumbbell hangs at each side with neutral wrists as the hips sit back into the single-leg squat.
// The figure pauses near parallel, then drives through the working heel to stand tall again.
import type { SideExercise } from '@/exercise.ts';
import { dumbbell } from '@/exercises/equipment/index.ts';
import { pistolPose, pistolTL } from './_single-leg-squat.ts';

export default {
  id: 'dumbbell-pistol-squat',
  name: '哑铃手枪深蹲',
  tl: pistolTL,
  meta: { en: 'Dumbbell Pistol Squat', family: 'single-leg-squat', equipment: ['dumbbell'], sources: ['hz:0411'] },
  muscles: [
    { m: 'glutes' }, { m: 'quads', side: 'near', scale: 0.7 },
    { m: 'hamstrings', side: 'near', scale: 0.4 }, { m: 'calves', side: 'near', scale: 0.3 },
  ],
  dynamic: [dumbbell('f', 'profile'), dumbbell('n', 'profile')],
  pose: (t) => pistolPose(t, 'sides'),
} satisfies SideExercise;
