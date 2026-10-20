// Kettlebell pistol squat, side view. The near heel stays down while the far leg stays long and level in front.
// Both hands hold the kettlebell horns at the chest as the hips sit back and the knee flexes.
// The one-second bottom pause is followed by a heel-driven return with the chest kept high.
import type { SideExercise } from '@/exercise.ts';
import { gripAt, kettlebell } from '@/exercises/equipment/index.ts';
import { pistolPose, pistolTL } from './_single-leg-squat.ts';

export default {
  id: 'kettlebell-pistol-squat',
  name: '壶铃手枪深蹲',
  tl: pistolTL,
  meta: {
    en: 'Kettlebell Pistol Squat', family: 'single-leg-squat', equipment: ['kettlebell'],
    sources: ['fe:Kettlebell_Pistol_Squat', 'hz:0544'],
  },
  muscles: [
    { m: 'quads', side: 'near' }, { m: 'glutes', scale: 0.6 },
    { m: 'hamstrings', side: 'near', scale: 0.4 }, { m: 'calves', side: 'near', scale: 0.35 },
  ],
  dynamic: [kettlebell((J) => ({ p: gripAt(J, 'n') }), 'face', 'underNearArm')],
  pose: (t) => pistolPose(t, 'goblet'),
} satisfies SideExercise;
