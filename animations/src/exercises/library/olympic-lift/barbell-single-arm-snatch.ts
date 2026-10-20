// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell single-arm snatch path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { singleArmSnatch } from './_olympic-lift.ts';

export default singleArmSnatch({id: 'barbell-single-arm-snatch', name: '杠铃单臂抓举', en: 'Barbell Single-Arm Snatch', sources: ['hz:0067']}) satisfies SideExercise;
