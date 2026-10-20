// Sit with the back on the pad, chest lifted and shoulder blades held back at the upper-chest handles.
// The high handles press forward on the lever and return with the elbows bending under control.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'machine-incline-chest-press',
  name: '器械上斜推胸',
  en: 'Machine Incline Chest Press',
  equipment: ['machine'],
  sources: ['fe:Leverage_Incline_Chest_Press', 'hz:1299', 'hz:1479'],
  kind: 'machine-seated',
  machinePath: 'incline',
}) satisfies SideExercise;
