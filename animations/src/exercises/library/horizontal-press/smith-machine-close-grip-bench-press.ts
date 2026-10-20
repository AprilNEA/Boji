// Lie under the Smith bar with feet planted and a close pronated grip at about shoulder width.
// Keep the elbows near the torso while lowering to the middle chest and pressing to lockout.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'smith-machine-close-grip-bench-press',
  name: '史密斯窄握卧推',
  en: 'Smith Machine Close-Grip Bench Press',
  equipment: ['smith', 'bench'],
  sources: ['fe:Smith_Machine_Close-Grip_Bench_Press'],
  kind: 'smith-bench',
  smithPosition: 'flat',
  smithGrip: 'close',
}) satisfies SideExercise;
