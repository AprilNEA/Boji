// Sit with the torso fixed against the backrest, one working foot on the horizontal footplate, and hands on the handles.
// Press the plate away with the working leg until nearly straight, then control the return with the pelvis against the pad.
import type { SideExercise } from '@/exercise.ts';
import { seatedLegPress } from './_squat-3.ts';

export default seatedLegPress({
  id: 'machine-single-leg-horizontal-leg-press', name: '器械单腿水平腿举', en: 'Machine Single-Leg Horizontal Leg Press',
  sources: ['hz:2611'], delta: -8, single: true,
}) satisfies SideExercise;
