// Flat bench press with both feet planted and the upper back supported by the pad.
// The dumbbells lower beside the chest in a neutral hold, then rotate to a pronated lockout.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'dumbbell-twisting-bench-press',
  name: '哑铃旋转卧推',
  en: 'Dumbbell Twisting Bench Press',
  equipment: ['dumbbell', 'bench'],
  sources: ['hz:1743'],
  kind: 'dumbbell-bench',
  twist: true,
}) satisfies SideExercise;
