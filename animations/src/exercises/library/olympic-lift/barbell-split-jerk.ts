// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell split jerk path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { jerk } from './_olympic-lift.ts';

export default jerk({id: 'barbell-split-jerk', name: '杠铃箭步挺举', en: 'Barbell Split Jerk', sources: ['fe:Split_Jerk']}, 'split') satisfies SideExercise;
