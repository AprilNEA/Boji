// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell block clean path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_olympic-lift.ts';

export default clean({id: 'barbell-block-clean', name: '杠铃垫块翻举', en: 'Barbell Block Clean', sources: ['fe:Clean_from_Blocks']}, 'block', 'full') satisfies SideExercise;
