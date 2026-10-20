// The pressing-side knee folds across the midline while the back remains on the floor.
// One kettlebell lowers toward the shoulder, then presses upward and inward for the extended range.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'kettlebell-single-arm-extended-range-floor-press',
  name: '壶铃单臂加大幅度地板卧推',
  en: 'Kettlebell Single-Arm Extended-Range Floor Press',
  equipment: ['kettlebell', 'mat'],
  sources: ['fe:Extended_Range_One-Arm_Kettlebell_Floor_Press', 'hz:0531'],
  kind: 'kettlebell-floor',
  floorMode: 'extended-range',
}) satisfies SideExercise;
