// Chest-supported T-bar row, side view. Stand on the platform with the upper chest held to the incline pad.
// Pull the handles from straight arms toward the torso with the upper arms close to the ribs.
// The pad prevents the torso from lifting or swinging as the lever returns under control.
import type { SideExercise } from '@/exercise.ts';
import { makeBentMachineRow } from './_horizontal-row-3.ts';

export default makeBentMachineRow({
  id: 'machine-chest-supported-t-bar-row', name: '器械胸托丁字杠划船', en: 'Machine Chest-Supported T-Bar Row',
  equipment: ['machine'], sources: ['fe:Lying_T-Bar_Row'],
}, { chestSupport: true }) satisfies SideExercise;
