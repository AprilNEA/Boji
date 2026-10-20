// Sit under the thigh pad with a close supinated grip on the bar.
// Keep the elbows close as the bar travels down to the upper chest.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-close-grip-underhand-lat-pulldown', name: '绳索窄握反手高位下拉', en: 'Cable Close-Grip Underhand Lat Pulldown',
  equipment: ['cable', 'machine'], sources: ['fe:Underhand_Cable_Pulldowns'],
}, { attachment: 'end' }) satisfies SideExercise;
