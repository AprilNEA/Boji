// Stand under the Smith bar with it across the upper back, hands wide on the bar, and feet planted at shoulder width.
// Keep the bar on its vertical rail while lowering to parallel, then drive evenly through the heels to stand.
import type { SideExercise } from '@/exercise.ts';
import { smithSquat } from './_squat-3.ts';

export default smithSquat({
  id: 'smith-machine-squat', name: '史密斯深蹲', en: 'Smith Machine Squat',
  sources: ['fe:Smith_Machine_Squat', 'hz:0770'],
}) satisfies SideExercise;
