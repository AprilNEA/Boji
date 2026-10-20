// Sit upright on a flat bench with feet planted and dumbbells resting near the thighs.
// Raise both straight arms forward to shoulder level, pause, then lower slowly with palms down.
// The bench, feet and neutral torso stay fixed while both dumbbells move with the hands.
import type { SideExercise } from '@/exercise.ts';
import { seatedFrontRaise } from './_front-raise.ts';

export default seatedFrontRaise({
  id: 'dumbbell-seated-front-raise', name: '哑铃坐姿前平举', en: 'Dumbbell Seated Front Raise',
  sources: ['hz:0392'],
}) satisfies SideExercise;
