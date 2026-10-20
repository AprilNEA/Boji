// The working-side ankle crosses over the other thigh while the free arm braces the torso on the floor.
// The kettlebell stays above the elbow as the arm presses to lockout and lowers until the elbow contacts the floor.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'kettlebell-single-arm-leg-over-floor-press',
  name: '壶铃单臂交叉腿地板卧推',
  en: 'Kettlebell Single-Arm Leg-Over Floor Press',
  equipment: ['kettlebell', 'mat'],
  sources: ['fe:Leg-Over_Floor_Press'],
  kind: 'kettlebell-floor',
  floorMode: 'leg-over',
}) satisfies SideExercise;
