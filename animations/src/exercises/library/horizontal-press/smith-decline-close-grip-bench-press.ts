// On the decline bench, secure the feet and take a close pronated grip on the guided bar.
// Keep the elbows beside the torso as the bar lowers near the chest and returns to full extension.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-decline-close-grip-bench-press',
  name: '史密斯下斜窄握卧推',
  en: 'Smith Decline Close-Grip Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['hz:1625'],
  kind: 'smith-bench',
  smithPosition: 'decline',
  smithGrip: 'close',
}) satisfies SideExercise;
