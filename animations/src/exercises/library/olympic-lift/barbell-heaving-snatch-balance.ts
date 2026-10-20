// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell heaving snatch balance path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { snatchBalance } from './_olympic-lift.ts';

export default snatchBalance({id: 'barbell-heaving-snatch-balance', name: '杠铃借力抓举下蹲', en: 'Barbell Heaving Snatch Balance', sources: ['fe:Heaving_Snatch_Balance']}, true) satisfies SideExercise;
