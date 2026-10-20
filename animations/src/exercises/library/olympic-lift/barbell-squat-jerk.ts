// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell squat jerk path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { jerk } from './_olympic-lift.ts';

export default jerk({id: 'barbell-squat-jerk', name: '杠铃下蹲挺举', en: 'Barbell Squat Jerk', sources: ['fe:Squat_Jerk', 'hz:0786']}, 'squat') satisfies SideExercise;
