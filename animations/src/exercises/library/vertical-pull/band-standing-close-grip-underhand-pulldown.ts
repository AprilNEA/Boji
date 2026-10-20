// Stand facing the high anchor with a close underhand hold and feet hip-width.
// Pull the band to the chest while the torso remains upright and braced.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'band-standing-close-grip-underhand-pulldown', name: '弹力带站姿窄握反握下拉', en: 'Band Standing Close-Grip Underhand Pulldown',
  equipment: ['band'], sources: ['hz:0974'],
}, { mode: 'standing', band: true }) satisfies SideExercise;
