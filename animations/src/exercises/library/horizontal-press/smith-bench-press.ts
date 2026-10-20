// Lie flat beneath the Smith bar with both feet planted and a slightly wider-than-shoulder pronated grip.
// Lower the guided bar to the chest with tucked elbows, then press it vertically to lockout.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-bench-press',
  name: '史密斯平板卧推',
  en: 'Smith Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['hz:0748'],
  kind: 'smith-bench',
  smithPosition: 'flat',
  smithGrip: 'standard',
}) satisfies SideExercise;
