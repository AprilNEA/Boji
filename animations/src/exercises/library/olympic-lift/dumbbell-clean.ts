// Start in the source-defined position with both feet planted and the load close to the body.
// Show the dumbbell clean path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellClean } from './_olympic-lift.ts';

export default dumbbellClean({id: 'dumbbell-clean', name: '哑铃翻举', en: 'Dumbbell Clean', sources: ['fe:Dumbbell_Clean', 'hz:0295']}) satisfies SideExercise;
