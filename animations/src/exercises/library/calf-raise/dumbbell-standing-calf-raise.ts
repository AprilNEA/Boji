// Standing calf raise with a dumbbell at each side and both forefeet on a low board.
// Both heels begin on the floor, then rise together as the knees stay straight.
// The board and the two dumbbells move only with their fixed contacts or hands.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellStandingCalves } from './_calf-raise-1.ts';

export default dumbbellStandingCalves({
  id: 'dumbbell-standing-calf-raise', name: '哑铃站姿提踵',
  meta: {
    en: 'Dumbbell Standing Calf Raise', family: 'calf-raise', equipment: ['dumbbell', 'other'],
    sources: ['fe:Standing_Dumbbell_Calf_Raise', 'hz:0417'],
  },
}) satisfies SideExercise;
