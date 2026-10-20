// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell split snatch path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { snatch } from './_olympic-lift.ts';

export default snatch({id: 'barbell-split-snatch', name: '杠铃箭步抓举', en: 'Barbell Split Snatch', sources: ['fe:Split_Snatch']}, 'floor', 'split') satisfies SideExercise;
