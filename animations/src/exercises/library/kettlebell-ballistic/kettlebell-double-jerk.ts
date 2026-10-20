// Start with both bells in a close shoulder rack and dip through the knees.
// Drive the bells overhead to straight elbows, then lower them back to the rack.
import type { SideExercise } from '@/exercise.ts';
import { jerk } from './_kettlebell-ballistic.ts';

export default jerk({ id: 'kettlebell-double-jerk', name: '双壶铃挺举', en: 'Kettlebell Double Jerk', sources: ['fe:Double_Kettlebell_Jerk', 'fe:Two-Arm_Kettlebell_Jerk', 'hz:0527'] }, true) satisfies SideExercise;
