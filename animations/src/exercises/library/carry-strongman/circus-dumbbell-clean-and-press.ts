// Start over the oversized bell with both hands on its thick central handle.
// Clean it to one shoulder, dip through the knees, then drive the working arm to a locked overhead position.
// The free hand releases after the clean while both feet stay flat during the drive.
import type { SideExercise } from '@/exercise.ts';
import { circusDumbbellCleanAndPress } from './_carry-strongman.ts';

export default circusDumbbellCleanAndPress({
  id: 'circus-dumbbell-clean-and-press', name: '大力士单臂哑铃翻举推举', en: 'Circus Dumbbell Clean and Press',
  equipment: ['dumbbell'], sources: ['fe:Circus_Bell'],
  muscles: [{ m: 'delts', side: 'near' }, { m: 'triceps', side: 'near', scale: 0.65 }, { m: 'quads', side: 'both', scale: 0.6 }, { m: 'glutes', scale: 0.55 }, { m: 'traps', scale: 0.45 }, { m: 'forearms', side: 'near', scale: 0.4 }],
}) satisfies SideExercise;
