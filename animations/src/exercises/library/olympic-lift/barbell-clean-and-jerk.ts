// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell clean and jerk path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { cleanAndJerk } from './_olympic-lift.ts';

export default cleanAndJerk({id: 'barbell-clean-and-jerk', name: '杠铃挺举', en: 'Barbell Clean and Jerk', sources: ['fe:Clean_and_Jerk']}) satisfies SideExercise;
