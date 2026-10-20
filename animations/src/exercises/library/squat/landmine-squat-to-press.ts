// Start in an athletic squat with both hands on the dual landmine handle at shoulder height.
// Drive through the feet to stand and press the diagonal bar forward and overhead before returning under control.
import type { SideExercise } from '@/exercise.ts';
import { landmineSquatToPress } from './_squat-3.ts';

export default landmineSquatToPress({
  id: 'landmine-squat-to-press', name: '地雷杆深蹲推举', en: 'Landmine Squat to Press',
  sources: ['fe:Landmine_Linear_Jammer'],
}) satisfies SideExercise;
