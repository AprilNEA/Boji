// Barbell narrow-stance back squat, side view. The bar stays high across the upper back while the feet remain close.
// The hips travel back into a parallel-depth squat, then the heels drive the body to a tall, neutral finish.
import type { SideExercise } from '@/exercise.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { backBarAt, backRackArms, squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.25);
export default {
  id: 'barbell-narrow-stance-back-squat', name: '杠铃窄距颈后深蹲', tl,
  meta: { en: 'Barbell Narrow-Stance Back Squat', family: 'squat', equipment: ['barbell'], sources: ['fe:Narrow_Stance_Squats', 'hz:0063'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.55 }, { m: 'hamstrings', side: 'both', scale: 0.35 }, { m: 'calves', side: 'both', scale: 0.3 }],
  dynamic: [barbell({ view: 'side', plate: 'medium', z: 'underNearArm', at: (J) => ({ p: backBarAt(J) }) })],
  pose: (t) => squatPose(tl.at(t).p, backRackArms(), { farDx: -2, back: 72, lean: 39 }),
} satisfies SideExercise;
