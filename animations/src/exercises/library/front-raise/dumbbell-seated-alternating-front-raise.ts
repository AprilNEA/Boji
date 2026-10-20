// Sit upright on a flat bench with both feet flat and dumbbells beside the thighs.
// Raise one straight arm to shoulder height, return it, then repeat with the other arm.
// The back remains tall against no support while the bench and feet stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { seatedFrontRaise } from './_front-raise.ts';

export default seatedFrontRaise({
  id: 'dumbbell-seated-alternating-front-raise', name: '哑铃坐姿交替前平举',
  en: 'Dumbbell Seated Alternating Front Raise', sources: ['hz:0387'], alternate: true,
}) satisfies SideExercise;
