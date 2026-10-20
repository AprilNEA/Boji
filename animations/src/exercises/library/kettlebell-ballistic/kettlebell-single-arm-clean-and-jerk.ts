// Start from one bell in a shoulder rack and dip through the knees.
// Drive the bell overhead to a locked elbow, then return it to the rack under control.
import type { SideExercise } from '@/exercise.ts';
import { jerk } from './_kettlebell-ballistic.ts';

export default jerk({ id: 'kettlebell-single-arm-clean-and-jerk', name: '壶铃单臂挺举', en: 'Kettlebell Single-Arm Clean and Jerk', sources: ['fe:One-Arm_Kettlebell_Clean_and_Jerk', 'hz:0537'] }, false) satisfies SideExercise;
