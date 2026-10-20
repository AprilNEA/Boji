// Barbell wide-stance back squat, side view. The bar sits on the traps while the far foot sets visibly farther back.
// The knees track outward over the feet as the hips descend to parallel, then the heels return the body upright.
import type { SideExercise } from '@/exercise.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { backBarAt, backRackArms, squatPose, squatTL } from './_squat-2.ts';

const tl = squatTL(0.3);
export default {
  id: 'barbell-wide-stance-back-squat', name: '杠铃宽距颈后深蹲', tl,
  meta: { en: 'Barbell Wide-Stance Back Squat', family: 'squat', equipment: ['barbell'], sources: ['hz:0098', 'fe:Wide_Stance_Barbell_Squat', 'hz:0124'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.45 }, { m: 'adductors', scale: 0.35 }, { m: 'calves', side: 'both', scale: 0.25 }],
  dynamic: [barbell({ view: 'side', plate: 'medium', z: 'underNearArm', at: (J) => ({ p: backBarAt(J) }) })],
  pose: (t) => squatPose(tl.at(t).p, backRackArms(), { farDx: -10, back: 86, bottom: 100, lean: 45 }),
} satisfies SideExercise;
