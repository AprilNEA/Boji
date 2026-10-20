// Sit tall against the pad with the handles set at the lower part of the chest and feet planted.
// The low handles press forward on the lever and return under control without resting on the stops.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'machine-decline-chest-press',
  name: '器械下斜推胸',
  en: 'Machine Decline Chest Press',
  equipment: ['machine'],
  sources: ['fe:Leverage_Decline_Chest_Press', 'hz:1300'],
  kind: 'machine-seated',
  machinePath: 'decline',
}) satisfies SideExercise;
