// Stand facing the high anchor with the arms fully extended overhead.
// Pull the underhand band toward the upper chest, then return to the long reach.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'band-underhand-lat-pulldown', name: '弹力带反握高位下拉', en: 'Band Underhand Lat Pulldown',
  equipment: ['band'], sources: ['hz:1013'],
}, { mode: 'standing', band: true, wide: true }) satisfies SideExercise;
