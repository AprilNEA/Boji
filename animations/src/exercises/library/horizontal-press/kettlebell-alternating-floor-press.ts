// Lying on the floor with knees bent and feet flat, both kettlebells begin above the chest.
// One elbow lowers toward the floor as the opposite arm locks out, then both sides exchange roles.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'kettlebell-alternating-floor-press',
  name: '壶铃交替地板卧推',
  en: 'Kettlebell Alternating Floor Press',
  equipment: ['kettlebell', 'mat'],
  sources: ['fe:Alternating_Floor_Press', 'hz:0519'],
  kind: 'kettlebell-floor',
  floorMode: 'alternating',
}) satisfies SideExercise;
