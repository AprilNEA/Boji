// Sit tall under the thigh pad with a slightly wide overhand grip.
// Draw the bar down to the chest while keeping the chest lifted.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-overhand-lat-pulldown', name: '绳索正握高位下拉', en: 'Cable Overhand Lat Pulldown',
  equipment: ['cable', 'machine'], sources: ['hz:0198'],
}, { attachment: 'end', wide: true }) satisfies SideExercise;
