// Barbell speed back squat, side view. The upper-back bar remains fixed to the torso during a quick, controlled cycle.
// The descent reaches a stable parallel position before the legs accelerate the bar and body back to lockout.
import type { SideExercise } from '@/exercise.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { backBarAt, backRackArms, speedSquatTL, squatPose } from './_squat-2.ts';

export default {
  id: 'barbell-speed-back-squat', name: '杠铃快速颈后深蹲', tl: speedSquatTL,
  meta: { en: 'Barbell Speed Back Squat', family: 'squat', equipment: ['barbell'], sources: ['hz:0101', 'fe:Speed_Squats'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.65 }, { m: 'hamstrings', side: 'both', scale: 0.4 }, { m: 'calves', side: 'both', scale: 0.3 }],
  dynamic: [barbell({ view: 'side', plate: 'medium', z: 'underNearArm', at: (J) => ({ p: backBarAt(J) }) })],
  pose: (t) => squatPose(speedSquatTL.at(t).p, backRackArms(), { farDx: -6, back: 78, bottom: 102, lean: 42 }),
} satisfies SideExercise;
