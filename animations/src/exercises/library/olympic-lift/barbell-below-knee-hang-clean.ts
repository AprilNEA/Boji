// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell below-knee hang clean path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_olympic-lift.ts';

export default clean({id: 'barbell-below-knee-hang-clean', name: '杠铃膝下悬垂翻举', en: 'Barbell Below-Knee Hang Clean', sources: ['fe:Hang_Clean_-_Below_the_Knees']}, 'below-knee', 'full') satisfies SideExercise;
