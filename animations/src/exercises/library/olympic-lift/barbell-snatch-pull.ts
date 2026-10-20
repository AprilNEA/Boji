// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell snatch pull path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { pull } from './_olympic-lift.ts';

export default pull({id: 'barbell-snatch-pull', name: '杠铃抓举拉', en: 'Barbell Snatch Pull', sources: ['fe:Snatch_Pull', 'hz:0776']}, 'floor', true) satisfies SideExercise;
