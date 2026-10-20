// Starts seated upright with feet flat, back supported, and handles at chest height.
// The elbows start near 90 degrees and extend forward while the shoulder blades and seat contact remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'cable-seated-chest-press', name: '绳索坐姿推胸', en: 'Cable Seated Chest Press',
  sources: ['fe:Cable_Chest_Press', 'hz:2144'],
  support: 'seat', implement: 'cable',
  cableHeight: 'mid',
}) satisfies SideExercise;
