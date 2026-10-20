// Starts in a planted staggered stance with both handles at chest height and the pulleys behind the shoulders.
// The torso stays still while the elbows extend forward, then return to about 90 degrees under cable tension.
import type { SideExercise } from '@/exercise.ts';
import { horizontalPress } from './_horizontal-press-2.ts';

export default horizontalPress({
  id: 'cable-standing-chest-press', name: '绳索站姿推胸', en: 'Cable Standing Chest Press',
  sources: ['fe:Standing_Cable_Chest_Press'],
  support: 'standing', implement: 'cable',
  cableHeight: 'mid',
}) satisfies SideExercise;
