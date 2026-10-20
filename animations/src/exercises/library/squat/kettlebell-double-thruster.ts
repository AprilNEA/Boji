// Double-kettlebell thruster, side view. Both bells begin racked at the shoulders during the squat.
// As the legs stand, both arms lock overhead; the bells return to the rack before the next repetition.
import type { SideExercise } from '@/exercise.ts';
import { gripAt, kettlebell } from '@/exercises/equipment/index.ts';
import { pressArms, squatPose, thrusterState, thrusterTL } from './_squat-2.ts';

export default {
  id: 'kettlebell-double-thruster', name: '双壶铃深蹲推举', tl: thrusterTL,
  poster: 0.68,
  meta: { en: 'Kettlebell Double Thruster', family: 'squat', equipment: ['kettlebell'], sources: ['fe:Kettlebell_Thruster'] },
  muscles: [{ m: 'delts', side: 'both' }, { m: 'quads', side: 'both', scale: 0.7 }, { m: 'triceps', side: 'both', scale: 0.45 }, { m: 'glutes', scale: 0.45 }],
  dynamic: [kettlebell((J) => ({ p: gripAt(J, 'f') }), 'edge', 'overFarArm', 'Far Kettlebell'), kettlebell((J) => ({ p: gripAt(J) }), 'face')],
  pose: (t) => { const s = thrusterState(t); return squatPose(s.squat, pressArms(s.press), { farDx: -8, back: 60, bottom: 98, lean: 24 }); },
} satisfies SideExercise;
