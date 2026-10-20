// Start standing with hammers at the sides, then raise both arms exactly to shoulder height.
// Hold the elbows nearly locked and the arms parallel to the floor for time.
// The torso stays vertical and the shoulders do not shrug toward the ears.
import type { FrontExercise } from '@/exercise.ts';
import { crucifixHold } from './_carry-strongman.ts';

export default crucifixHold({
  id: 'crucifix-hold', name: '大力士十字静力支撑', en: 'Crucifix Hold',
  equipment: ['other'], sources: ['fe:Crucifix'],
  muscles: [{ m: 'delts', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.5 }, { m: 'traps', scale: 0.3 }],
}) satisfies FrontExercise;
