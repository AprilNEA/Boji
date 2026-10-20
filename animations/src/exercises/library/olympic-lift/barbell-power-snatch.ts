// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell power snatch path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { snatch } from './_olympic-lift.ts';

export default snatch({id: 'barbell-power-snatch', name: '杠铃高抓', en: 'Barbell Power Snatch', sources: ['fe:Power_Snatch']}, 'floor', 'power') satisfies SideExercise;
