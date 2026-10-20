// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell split clean path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_olympic-lift.ts';

export default clean({id: 'barbell-split-clean', name: '杠铃箭步翻站', en: 'Barbell Split Clean', sources: ['fe:Split_Clean']}, 'floor', 'split') satisfies SideExercise;
