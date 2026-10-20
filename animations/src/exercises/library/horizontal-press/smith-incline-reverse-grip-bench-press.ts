// Use an incline bench with the back supported and feet flat, as the source instructions specify.
// The source specifies an overhand grip, so the guided bar lowers toward the chest and presses back to lockout.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-incline-reverse-grip-bench-press',
  name: '史密斯上斜卧推',
  en: 'Smith Incline Reverse-Grip Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['hz:0758'],
  kind: 'smith-bench',
  smithPosition: 'incline',
  smithGrip: 'standard',
}) satisfies SideExercise;
