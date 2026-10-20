// Keep the chest on the incline support while both long arms hang perpendicular to the floor.
// Raise the nearly straight arms sideways into a level T, pause, then lower without lifting the torso.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-incline-t-raise', name: '哑铃上斜T举',
  en: 'Dumbbell Incline T Raise', sources: ['hz:3542'],
}, { support: 'incline', straight: true }) satisfies FrontExercise;
