// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell power clean from blocks path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_olympic-lift.ts';

export default clean({id: 'barbell-power-clean-from-blocks', name: '杠铃垫块高翻', en: 'Barbell Power Clean from Blocks', sources: ['fe:Power_Clean_from_Blocks']}, 'block', 'power') satisfies SideExercise;
