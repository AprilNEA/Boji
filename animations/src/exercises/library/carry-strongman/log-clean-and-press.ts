// Start with both hands on the neutral internal handles of the log in front of the feet.
// Clean the horizontal log onto the upper chest, make a shallow knee dip, and press it overhead with locked elbows.
// The log stays centered between both hands during the clean and the press.
import type { SideExercise } from '@/exercise.ts';
import { logCleanAndPress } from './_carry-strongman.ts';

export default logCleanAndPress({
  id: 'log-clean-and-press', name: '圆木翻举推举', en: 'Log Clean and Press',
  equipment: ['other'], sources: ['fe:Log_Lift'],
  muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.65 }, { m: 'quads', side: 'both', scale: 0.6 }, { m: 'glutes', scale: 0.55 }, { m: 'traps', scale: 0.5 }, { m: 'abs', scale: 0.4 }],
}) satisfies SideExercise;
