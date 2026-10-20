// On the decline bench, secure the feet and hold the Smith bar with a close underhand grip.
// The elbows stay close as the bar approaches the chest and returns vertically to a controlled lockout.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-decline-close-reverse-grip-bench-press',
  name: '史密斯下斜窄距反握卧推',
  en: 'Smith Decline Close Reverse-Grip Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['hz:1626'],
  kind: 'smith-bench',
  smithPosition: 'decline',
  smithGrip: 'reverse',
}) satisfies SideExercise;
