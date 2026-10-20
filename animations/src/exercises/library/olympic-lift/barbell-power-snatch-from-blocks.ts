// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell power snatch from blocks path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { snatch } from './_olympic-lift.ts';

export default snatch({id: 'barbell-power-snatch-from-blocks', name: '杠铃垫块高抓', en: 'Barbell Power Snatch from Blocks', sources: ['fe:Power_Snatch_from_Blocks']}, 'block', 'power') satisfies SideExercise;
