// Sit against the reclined pad with shoulder-width feet flat on the 45-degree footplate and hands on the handles.
// Extend both legs without locking the knees, then return the sled by bending the knees while the pelvis stays supported.
import type { SideExercise } from '@/exercise.ts';
import { seatedLegPress } from './_squat-3.ts';

export default seatedLegPress({
  id: 'machine-45-degree-leg-press', name: '器械四十五度腿举', en: 'Machine 45-Degree Leg Press',
  sources: ['hz:0739', 'hz:1464', 'hz:1463'], delta: -42,
}) satisfies SideExercise;
