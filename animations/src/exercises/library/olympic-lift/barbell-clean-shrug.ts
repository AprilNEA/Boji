// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell clean shrug path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { cleanShrug } from './_olympic-lift.ts';

export default cleanShrug({id: 'barbell-clean-shrug', name: '杠铃翻举耸肩', en: 'Barbell Clean Shrug', sources: ['fe:Clean_Shrug']}) satisfies SideExercise;
