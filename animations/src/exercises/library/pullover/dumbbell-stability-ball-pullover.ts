// The upper back rests on the stability ball while both feet remain flat under bent knees.
// Both hands control one dumbbell from above the chest to behind the head without moving the pelvis.
import type { SideExercise } from '@/exercise.ts';
import { ballPullover } from './_pullover.ts';

export default ballPullover({
  id: 'dumbbell-stability-ball-pullover',
  name: '哑铃健身球仰卧上拉',
  meta: {
    en: 'Dumbbell Stability Ball Pullover', family: 'pullover', equipment: ['dumbbell', 'stability-ball'],
    sources: ['hz:1284'],
  },
}) satisfies SideExercise;
