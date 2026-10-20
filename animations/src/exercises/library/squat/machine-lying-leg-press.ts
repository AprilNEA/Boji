// Lie face up on the sled pad with both feet shoulder-width on the footplate and the back and head supported.
// Push the sled upward by extending the hips and knees, then lower it by bending both joints while keeping contact.
import type { SideExercise } from '@/exercise.ts';
import { supineLegPress } from './_squat-3.ts';

export default supineLegPress({
  id: 'machine-lying-leg-press', name: '器械仰卧腿举', en: 'Machine Lying Leg Press', sources: ['hz:0744'],
}) satisfies SideExercise;
