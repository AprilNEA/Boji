// Lie on a flat bench beneath the Smith machine with feet planted and a pronated grip wider than shoulder width.
// The bar lowers to the middle chest, pauses, then travels straight up the guide rail to lockout.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-machine-bench-press',
  name: '史密斯平板卧推',
  en: 'Smith Machine Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['fe:Smith_Machine_Bench_Press'],
  kind: 'smith-bench',
  smithPosition: 'flat',
  smithGrip: 'standard',
}) satisfies SideExercise;
