// Standing calf raise with the lower back supported by a wall ball and dumbbells at both sides.
// A small ball remains between the knees while both heels rise over the planted forefeet.
// The wall, stability ball, and knee squeeze stay in position through the ankle-only motion.
import type { SideExercise } from '@/exercise.ts';
import { wallBallDumbbellCalves } from './_calf-raise-1.ts';

export default wallBallDumbbellCalves({
  id: 'dumbbell-wall-ball-calf-raise-with-knee-squeeze', name: '哑铃靠墙健身球夹膝提踵',
  meta: {
    en: 'Dumbbell Wall Ball Calf Raise with Knee Squeeze', family: 'calf-raise', equipment: ['dumbbell', 'stability-ball', 'wall', 'other'],
    sources: ['hz:3240'],
  },
}) satisfies SideExercise;
