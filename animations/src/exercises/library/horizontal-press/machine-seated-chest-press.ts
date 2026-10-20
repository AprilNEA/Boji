// Sit upright with the back on the pad and forearms pointing forward from elbows level with the chest.
// Pronated handles return toward the torso, then press away until both elbows extend softly.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-3.ts';

export default horizontalPress({
  id: 'machine-seated-chest-press',
  name: '器械坐姿推胸',
  en: 'Machine Seated Chest Press',
  equipment: ['machine'],
  sources: ['fe:Machine_Bench_Press'],
  kind: 'machine-seated',
  machinePath: 'level',
}) satisfies SideExercise;
