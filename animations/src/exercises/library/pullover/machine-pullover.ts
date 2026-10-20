// Sit against the back pad with the feet fixed on the floor and both hands on the machine handles.
// Slightly bent arms bring the handles from overhead toward the chest while the torso stays supported.
import type { SideExercise } from '@/exercise.ts';
import { machinePullover } from './_pullover.ts';

export default machinePullover(
  'machine-pullover',
  '器械直臂下拉',
  {
    en: 'Machine Pullover', family: 'pullover', equipment: ['machine'],
    sources: ['hz:2285'],
  },
) satisfies SideExercise;
