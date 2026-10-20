// The upper back rests on a stability ball and both feet remain planted below bent knees.
// A controlled dumbbell pullover returns overhead before the hips extend and lower without changing the arm position.
import type { SideExercise } from '@/exercise.ts';
import { ballPullover } from './_pullover.ts';

export default ballPullover({
  id: 'dumbbell-pullover-with-hip-extension-on-stability-ball',
  name: '健身球哑铃上拉接髋伸展',
  meta: {
    en: 'Dumbbell Pullover with Hip Extension on Stability Ball', family: 'pullover', equipment: ['dumbbell', 'stability-ball'],
    sources: ['hz:1294'],
  },
  hipExtension: true,
}) satisfies SideExercise;
