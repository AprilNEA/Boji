// Lying on the floor with bent knees and planted feet, the working upper arm remains supported at the bottom.
// The kettlebell presses vertically to a controlled lockout and returns without lifting the torso.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'kettlebell-single-arm-floor-press',
  name: '壶铃单臂地板卧推',
  en: 'Kettlebell Single-Arm Floor Press',
  equipment: ['kettlebell', 'mat'],
  sources: ['fe:One-Arm_Kettlebell_Floor_Press', 'hz:1298'],
  kind: 'kettlebell-floor',
  floorMode: 'single-arm',
}) satisfies SideExercise;
