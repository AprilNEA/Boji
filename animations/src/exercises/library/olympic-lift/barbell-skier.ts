// Start in the source-defined position with both feet planted and the load close to the body.
// Show the barbell skier path and the specified receiving position before the controlled return.
import type { SideExercise } from '@/exercise.ts';
import { skier } from './_olympic-lift.ts';

export default skier({id: 'barbell-skier', name: '杠铃滑雪式提拉', en: 'Barbell Skier', sources: ['hz:0100']}) satisfies SideExercise;
