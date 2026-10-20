// Set an incline bench under the Smith rail with the upper chest aligned to the bar and both feet planted.
// The wide pronated grip lowers the bar to the upper chest, then presses it vertically to lockout.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-machine-incline-bench-press',
  name: '史密斯上斜卧推',
  en: 'Smith Machine Incline Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['fe:Smith_Machine_Incline_Bench_Press'],
  kind: 'smith-bench',
  smithPosition: 'incline',
  smithGrip: 'wide',
}) satisfies SideExercise;
