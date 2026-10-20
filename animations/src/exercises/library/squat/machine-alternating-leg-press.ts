// Sit with the back against the backrest and each foot on an independent press plate.
// Extend one leg nearly straight, lower it under control, and alternate to the other leg without lifting the pelvis.
import type { SideExercise } from '@/exercise.ts';
import { seatedLegPress } from './_squat-3.ts';

export default seatedLegPress({
  id: 'machine-alternating-leg-press', name: '器械交替腿举', en: 'Machine Alternating Leg Press',
  sources: ['hz:2287'], delta: -8, alternating: true,
}) satisfies SideExercise;
