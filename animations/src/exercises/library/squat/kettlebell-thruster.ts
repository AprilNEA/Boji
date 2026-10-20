// Kettlebell thruster, side view. Both hands hold one bell at the chest during the squat, then press it overhead.
// The arms lock out as the legs finish standing, and the bell returns under control to the chest before repeating.
import type { SideExercise } from '@/exercise.ts';
import { gripAt, kettlebell } from '@/exercises/equipment/index.ts';
import { pressArms, squatPose, thrusterState, thrusterTL } from './_squat-2.ts';

export default {
  id: 'kettlebell-thruster', name: '壶铃深蹲推举', tl: thrusterTL,
  poster: 0.68,
  meta: { en: 'Kettlebell Thruster', family: 'squat', equipment: ['kettlebell'], sources: ['hz:0550'] },
  muscles: [{ m: 'delts', side: 'both' }, { m: 'quads', side: 'both', scale: 0.7 }, { m: 'triceps', side: 'both', scale: 0.45 }, { m: 'glutes', scale: 0.45 }, { m: 'abs', scale: 0.25 }],
  dynamic: [kettlebell((J) => ({ p: gripAt(J) }), 'face')],
  pose: (t) => { const s = thrusterState(t); return squatPose(s.squat, pressArms(s.press), { farDx: -6, back: 62, bottom: 99, lean: 25 }); },
} satisfies SideExercise;
