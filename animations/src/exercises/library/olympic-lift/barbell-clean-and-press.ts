// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell clean and press path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { cleanAndPress } from './_olympic-lift.ts';

export default cleanAndPress({id: 'barbell-clean-and-press', name: '杠铃翻举推举', en: 'Barbell Clean and Press', sources: ['fe:Clean_and_Press', 'hz:0028']}) satisfies SideExercise;
