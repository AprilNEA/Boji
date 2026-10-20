// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell hang snatch path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { snatch } from './_olympic-lift.ts';

export default snatch({id: 'barbell-hang-snatch', name: '杠铃悬垂抓举', en: 'Barbell Hang Snatch', sources: ['fe:Hang_Snatch']}, 'hang', 'full') satisfies SideExercise;
