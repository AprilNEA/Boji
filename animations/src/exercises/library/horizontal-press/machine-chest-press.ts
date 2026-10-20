// Sit with the back against the pad, chest lifted, shoulder blades retracted and both feet on the floor.
// Mid-chest handles move forward on the plate-loaded lever until the elbows reach a soft lockout.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'machine-chest-press',
  name: '器械推胸',
  en: 'Machine Chest Press',
  equipment: ['machine'],
  sources: ['fe:Leverage_Chest_Press', 'hz:0577', 'hz:0576'],
  kind: 'machine-seated',
  machinePath: 'level',
}) satisfies SideExercise;
