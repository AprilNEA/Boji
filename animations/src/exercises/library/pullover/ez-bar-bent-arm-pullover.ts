// Lie on a flat bench with the head at the pad end and both feet planted.
// The EZ bar travels behind the head while the elbows retain their slight bend throughout the shoulder arc.
import type { SideExercise } from '@/exercise.ts';
import { flatPullover } from './_pullover.ts';

export default flatPullover({
  id: 'ez-bar-bent-arm-pullover',
  name: '曲杆屈臂仰卧上拉',
  meta: {
    en: 'EZ-Bar Bent-Arm Pullover', family: 'pullover', equipment: ['ez-bar', 'bench'],
    sources: ['hz:3010'],
  },
  weight: 'ez-bar', bent: true,
}) satisfies SideExercise;
