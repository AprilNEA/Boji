// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell hang muscle snatch path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { snatch } from './_olympic-lift.ts';

export default snatch({id: 'barbell-hang-muscle-snatch', name: '杠铃悬垂力量抓举', en: 'Barbell Hang Muscle Snatch', sources: ['fe:Muscle_Snatch']}, 'hang', 'stand') satisfies SideExercise;
