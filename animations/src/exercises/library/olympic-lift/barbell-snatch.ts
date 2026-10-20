// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell snatch path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { snatch } from './_olympic-lift.ts';

export default snatch({id: 'barbell-snatch', name: '杠铃抓举', en: 'Barbell Snatch', sources: ['fe:Snatch']}, 'floor', 'full') satisfies SideExercise;
