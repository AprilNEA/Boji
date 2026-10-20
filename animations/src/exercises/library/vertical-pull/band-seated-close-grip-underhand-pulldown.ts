// Sit tall facing the high anchor with a close underhand hold on the band.
// Keep the torso fixed as both hands travel down to the upper chest.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'band-seated-close-grip-underhand-pulldown', name: '弹力带坐姿窄握反握下拉', en: 'Band Seated Close-Grip Underhand Pulldown',
  equipment: ['band', 'bench'], sources: ['hz:3117'],
}, { mode: 'seated', band: true }) satisfies SideExercise;
