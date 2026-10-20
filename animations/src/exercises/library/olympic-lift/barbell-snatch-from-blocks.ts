// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell snatch from blocks path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { snatch } from './_olympic-lift.ts';

export default snatch({id: 'barbell-snatch-from-blocks', name: '杠铃垫上抓举', en: 'Barbell Snatch from Blocks', sources: ['fe:Snatch_from_Blocks']}, 'block', 'full') satisfies SideExercise;
