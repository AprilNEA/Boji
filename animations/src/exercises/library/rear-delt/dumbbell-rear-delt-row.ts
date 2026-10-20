// Hinge forward with a neutral back and let both dumbbells hang below the shoulders with soft elbows.
// Pull the elbows outward and upward toward the upper torso, then lower without swinging the trunk.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-rear-delt-row', name: '哑铃俯身后束划船',
  en: 'Dumbbell Rear Delt Row', sources: ['hz:0377'],
}, { row: true }) satisfies FrontExercise;
