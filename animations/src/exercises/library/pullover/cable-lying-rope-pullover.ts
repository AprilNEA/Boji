// Flat bench with the head toward the high pulley and both feet flat on the floor.
// Nearly straight arms pull the rope from behind the head to above the chest through a fixed shoulder arc.
import type { SideExercise } from '@/exercise.ts';
import { lyingCablePullover } from './_pullover.ts';

export default lyingCablePullover(
  'cable-lying-rope-pullover',
  '绳索仰卧绳把直臂上拉',
  {
    en: 'Cable Lying Rope Pullover', family: 'pullover', equipment: ['cable', 'bench'],
    sources: ['hz:0184'],
  },
) satisfies SideExercise;
