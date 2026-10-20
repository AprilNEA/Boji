// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell power clean path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { clean } from './_olympic-lift.ts';

export default clean({id: 'barbell-power-clean', name: '杠铃高翻', en: 'Barbell Power Clean', sources: ['fe:Power_Clean', 'hz:0648']}, 'floor', 'power') satisfies SideExercise;
