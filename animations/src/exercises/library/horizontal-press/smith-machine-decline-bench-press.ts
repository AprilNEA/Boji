// Lie on a decline bench beneath the Smith bar with feet secured and shoulder blades retracted.
// The pronated bar touches the chest lightly, then rises on the fixed guide path through elbow extension.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-machine-decline-bench-press',
  name: '史密斯下斜卧推',
  en: 'Smith Machine Decline Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['fe:Decline_Smith_Press', 'fe:Smith_Machine_Decline_Press'],
  kind: 'smith-bench',
  smithPosition: 'decline',
  smithGrip: 'standard',
}) satisfies SideExercise;
