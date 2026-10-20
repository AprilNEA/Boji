// On the decline bench, secure the feet and align the lower chest below the Smith bar with a wide grip.
// The elbows point outward while the guided bar lowers to the chest and presses to lockout.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-wide-grip-decline-bench-press',
  name: '史密斯宽握下斜卧推',
  en: 'Smith Wide-Grip Decline Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['hz:1309'],
  kind: 'smith-bench',
  smithPosition: 'decline',
  smithGrip: 'wide',
}) satisfies SideExercise;
