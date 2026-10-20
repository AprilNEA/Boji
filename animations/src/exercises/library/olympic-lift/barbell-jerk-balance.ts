// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell jerk balance path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { jerk } from './_olympic-lift.ts';

export default jerk({id: 'barbell-jerk-balance', name: '杠铃分腿挺举平衡练习', en: 'Barbell Jerk Balance', sources: ['fe:Jerk_Balance']}, 'split', true) satisfies SideExercise;
