// The upper back rests on a stability ball with both feet flat and knees bent.
// One arm lowers the dumbbell behind the head and returns over the chest; the free hand rests on the abdomen.
// The source switches arms after the set, so the loop shows the same arm.
import type { SideExercise } from '@/exercise.ts';
import { singleArmBallPullover } from './_pullover.ts';

export default singleArmBallPullover(
  'dumbbell-single-arm-stability-ball-pullover',
  '哑铃单臂健身球仰卧上拉',
  {
    en: 'Dumbbell Single-Arm Stability Ball Pullover', family: 'pullover', equipment: ['dumbbell', 'stability-ball'],
    sources: ['hz:1291'],
  },
) satisfies SideExercise;
