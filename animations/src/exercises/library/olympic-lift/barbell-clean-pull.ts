// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell clean pull path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { pull } from './_olympic-lift.ts';

export default pull({id: 'barbell-clean-pull', name: '杠铃翻举拉', en: 'Barbell Clean Pull', sources: ['fe:Clean_Pull']}, 'floor') satisfies SideExercise;
