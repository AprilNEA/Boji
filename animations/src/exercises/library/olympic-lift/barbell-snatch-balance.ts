// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell snatch balance path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { snatchBalance } from './_olympic-lift.ts';

export default snatchBalance({id: 'barbell-snatch-balance', name: '杠铃抓举下蹲', en: 'Barbell Snatch Balance', sources: ['fe:Snatch_Balance']}) satisfies SideExercise;
