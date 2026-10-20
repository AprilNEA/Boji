// Kneel below the high anchor with the working arm reaching overhead.
// Pull the elbow down to the ribs without leaning the trunk sideways.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'band-kneeling-single-arm-pulldown', name: '弹力带跪姿单臂下拉', en: 'Band Kneeling Single-Arm Pulldown',
  equipment: ['band'], sources: ['hz:0983'],
}, { mode: 'kneeling', band: true, unilateral: true }) satisfies SideExercise;
