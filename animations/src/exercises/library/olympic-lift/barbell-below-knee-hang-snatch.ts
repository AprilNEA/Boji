// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell below-knee hang snatch path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { snatch } from './_olympic-lift.ts';

export default snatch({id: 'barbell-below-knee-hang-snatch', name: '杠铃膝下悬垂抓举', en: 'Barbell Below-Knee Hang Snatch', sources: ['fe:Hang_Snatch_-_Below_Knees']}, 'below-knee', 'full') satisfies SideExercise;
