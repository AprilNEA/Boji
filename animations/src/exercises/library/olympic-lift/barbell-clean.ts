// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell clean path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_olympic-lift.ts';

export default clean({id: 'barbell-clean', name: '杠铃翻举', en: 'Barbell Clean', sources: ['fe:Clean']}, 'floor', 'full') satisfies SideExercise;
