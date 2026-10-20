// Start straddling the loaded pipe trainer with both hands wrapped around its central handle.
// Pull the trainer from the floor, settle it in the lap, then extend the knees and hips with it held high.
// The trainer remains a horizontal pipe with loaded ends, unlike the round stone event.
import type { SideExercise } from '@/exercise.ts';
import { atlasStoneLift } from './_carry-strongman.ts';

export default atlasStoneLift({
  id: 'atlas-stone-trainer-lift', name: '阿特拉斯石模拟器上举', en: 'Atlas Stone Trainer Lift',
  equipment: ['other'], sources: ['fe:Atlas_Stone_Trainer'],
  muscles: [{ m: 'lowerBack' }, { m: 'quads', side: 'both', scale: 0.7 }, { m: 'glutes', scale: 0.65 }, { m: 'hamstrings', side: 'both', scale: 0.6 }, { m: 'biceps', side: 'both', scale: 0.45 }, { m: 'forearms', side: 'both', scale: 0.4 }],
}, true) satisfies SideExercise;
