// Start beside the bar with one hand at its center and both knees bent for the floor pull.
// Stand without side bending, then return the bar beside the outside leg under control.
// The loop repeats the same honest pull on the other side without changing the trunk position.
import type { SideExercise } from '@/exercise.ts';
import { suitcaseDeadlift } from './_hinge-1.ts';

export default suitcaseDeadlift(
  'barbell-single-arm-suitcase-deadlift',
  '杠铃单臂手提箱硬拉',
  'Barbell Single-Arm Suitcase Deadlift',
  ['fe:One-Arm_Side_Deadlift'],
) satisfies SideExercise;
