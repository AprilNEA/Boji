// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell power jerk path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { jerk } from './_olympic-lift.ts';

export default jerk({id: 'barbell-power-jerk', name: '杠铃半蹲挺', en: 'Barbell Power Jerk', sources: ['fe:Power_Jerk']}, 'power') satisfies SideExercise;
