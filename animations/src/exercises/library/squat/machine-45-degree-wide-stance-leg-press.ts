// Sit against the sled pad with the feet set wider than shoulder width on the angled platform.
// Press both heels through the platform without lifting the pelvis, then bend the knees back to the wide start stance.
import type { SideExercise } from '@/exercise.ts';
import { seatedLegPress } from './_squat-3.ts';

export default seatedLegPress({
  id: 'machine-45-degree-wide-stance-leg-press', name: '器械四十五度宽距腿举', en: 'Machine 45-Degree Wide-Stance Leg Press',
  sources: ['hz:0740'], delta: -42, farDx: -18,
}) satisfies SideExercise;
