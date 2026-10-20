// Lie on the decline bench with the feet secured under the roller and the chest aligned below the Smith bar.
// The pronated bar lowers to the lower chest with tucked elbows, then rises on its fixed rail.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-decline-bench-press',
  name: '史密斯下斜卧推',
  en: 'Smith Decline Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['hz:0753'],
  kind: 'smith-bench',
  smithPosition: 'decline',
  smithGrip: 'standard',
}) satisfies SideExercise;
