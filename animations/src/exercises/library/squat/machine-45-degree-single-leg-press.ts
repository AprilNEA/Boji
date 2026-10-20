// Sit on the 45-degree sled with the back fixed to the pad and one foot pressing while the other knee bends.
// The loop alternates the legs: each leg extends the sled, returns under control, and then yields to the other leg.
import type { SideExercise } from '@/exercise.ts';
import { seatedLegPress } from './_squat-3.ts';

export default seatedLegPress({
  id: 'machine-45-degree-single-leg-press', name: '器械四十五度单腿腿举', en: 'Machine 45-Degree Single-Leg Press',
  sources: ['hz:1425'], delta: -42, alternating: true,
}) satisfies SideExercise;
