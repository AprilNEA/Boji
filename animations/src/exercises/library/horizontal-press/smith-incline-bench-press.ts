// Recline on a 30 to 45 degree incline bench with the upper chest aligned under the Smith bar and feet planted.
// Lower the pronated bar to the upper chest with tucked elbows, then press it straight up the guide rail.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-incline-bench-press',
  name: '史密斯上斜卧推',
  en: 'Smith Incline Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['hz:0757'],
  kind: 'smith-bench',
  smithPosition: 'incline',
  smithGrip: 'standard',
}) satisfies SideExercise;
