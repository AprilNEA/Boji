// Stand facing the high anchor with hands slightly wider than shoulder-width.
// Draw the underhand band grip down toward the chest without bending the spine.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'band-standing-underhand-pulldown', name: '弹力带站姿反握下拉', en: 'Band Standing Underhand Pulldown',
  equipment: ['band'], sources: ['hz:3116'],
}, { mode: 'standing', band: true, wide: true }) satisfies SideExercise;
