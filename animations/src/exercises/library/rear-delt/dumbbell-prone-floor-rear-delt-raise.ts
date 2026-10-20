// Lie face down with the trunk quiet and both soft elbows reaching forward from the shoulders.
// Sweep the dumbbells outward to the sides by the rear delts, then lower without extending the low back.
import type { FrontExercise } from '@/exercise.ts';
import { frontDumbbellFly } from './_rear-delt-2.ts';

export default frontDumbbellFly({
  id: 'dumbbell-prone-floor-rear-delt-raise', name: '哑铃俯卧地板后束平举',
  en: 'Dumbbell Prone Floor Rear Delt Raise', sources: ['hz:2470'],
}, { support: 'floor' }) satisfies FrontExercise;
