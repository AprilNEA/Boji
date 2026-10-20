// Barbell thruster, side view. The bar begins at the shoulders, stays racked during the squat, and locks out overhead.
// Leg drive starts the rise, then the elbows extend; the bar returns to the shoulders before the seamless next rep.
import type { SideExercise } from '@/exercise.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { grip, pressArms, squatPose, thrusterState, thrusterTL } from './_squat-2.ts';

export default {
  id: 'barbell-thruster', name: '杠铃深蹲推举', tl: thrusterTL,
  poster: 0.68,
  meta: { en: 'Barbell Thruster', family: 'squat', equipment: ['barbell'], sources: ['hz:3305'] },
  muscles: [{ m: 'delts', side: 'both' }, { m: 'quads', side: 'both', scale: 0.75 }, { m: 'glutes', scale: 0.55 }, { m: 'triceps', side: 'both', scale: 0.5 }, { m: 'abs', scale: 0.3 }],
  dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: grip(J) }) })],
  pose: (t) => { const s = thrusterState(t); return squatPose(s.squat, pressArms(s.press), { farDx: -6, back: 64, bottom: 101, lean: 28 }); },
} satisfies SideExercise;
