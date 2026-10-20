// Start with one hand holding a bar beside the outside leg and the trunk square over planted feet.
// Hinge and bend the knees to lower the bar, then stand without lateral trunk lean.
// The loop changes sides so both unilateral repetitions are shown with the same form.
import type { SideExercise } from '@/exercise.ts';
import { suitcaseDeadlift } from './_hinge-1.ts';

export default suitcaseDeadlift(
  'barbell-suitcase-deadlift',
  '杠铃单手体侧硬拉',
  'Barbell Suitcase Deadlift',
  ['hz:0066'],
) satisfies SideExercise;
