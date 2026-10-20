// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell hang clean path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_olympic-lift.ts';

export default clean({id: 'barbell-hang-clean', name: '杠铃悬垂翻举', en: 'Barbell Hang Clean', sources: ['fe:Hang_Clean']}, 'hang', 'stand') satisfies SideExercise;
