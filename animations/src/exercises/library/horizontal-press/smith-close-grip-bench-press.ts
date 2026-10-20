// Lie on a flat bench with feet down and take the Smith bar slightly inside shoulder width.
// Keep the elbows close to the torso as the guided bar lowers to the chest and presses back up.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-close-grip-bench-press',
  name: '史密斯窄握卧推',
  en: 'Smith Close-Grip Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['hz:0751'],
  kind: 'smith-bench',
  smithPosition: 'flat',
  smithGrip: 'close',
}) satisfies SideExercise;
