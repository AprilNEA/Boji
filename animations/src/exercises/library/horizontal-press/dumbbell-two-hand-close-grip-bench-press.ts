// The shoulders rest across a flat bench while the hips stay below the bench and both feet support the body.
// Both palms support one upright dumbbell, which lowers to the chest and returns by elbow extension.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'dumbbell-two-hand-close-grip-bench-press',
  name: '双手单哑铃窄握卧推',
  en: 'Dumbbell Two-Hand Close-Grip Bench Press',
  equipment: ['dumbbell', 'bench'],
  sources: ['fe:Close-Grip_Dumbbell_Press'],
  kind: 'two-hand-dumbbell-bench',
}) satisfies SideExercise;
