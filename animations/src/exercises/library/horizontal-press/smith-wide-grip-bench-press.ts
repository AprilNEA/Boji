// Lie on a flat bench under the Smith bar with feet planted and a wide pronated grip.
// The elbows point outward as the bar touches the chest and then rises vertically to full extension.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-wide-grip-bench-press',
  name: '史密斯宽握卧推',
  en: 'Smith Wide-Grip Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['hz:1308'],
  kind: 'smith-bench',
  smithPosition: 'flat',
  smithGrip: 'wide',
}) satisfies SideExercise;
