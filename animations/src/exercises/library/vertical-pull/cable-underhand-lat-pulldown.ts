// Sit with thighs secured and hands supinated on the pulley bar.
// Pull the bar to the upper chest while keeping the chest tall.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-underhand-lat-pulldown', name: '绳索反握高位下拉', en: 'Cable Underhand Lat Pulldown',
  equipment: ['cable', 'machine'], sources: ['hz:0245'],
}, { attachment: 'end', wide: true }) satisfies SideExercise;
