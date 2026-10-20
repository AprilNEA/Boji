// Lie on a decline bench with feet secured under the roller and take the Smith bar with an underhand grip.
// Lower the guided bar toward the chest with elbows tucked, then extend the arms to raise it.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-decline-reverse-grip-bench-press',
  name: '史密斯下斜反握卧推',
  en: 'Smith Decline Reverse-Grip Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['hz:0754'],
  kind: 'smith-bench',
  smithPosition: 'decline',
  smithGrip: 'reverse',
}) satisfies SideExercise;
