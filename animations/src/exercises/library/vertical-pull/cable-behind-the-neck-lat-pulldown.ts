// Sit below the high pulley with the head forward and the wide bar behind it.
// Draw the bar to the back of the neck, then return to the overhead stretch.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-behind-the-neck-lat-pulldown', name: '绳索颈后高位下拉', en: 'Cable Behind-the-Neck Lat Pulldown',
  equipment: ['cable', 'machine'], sources: ['hz:0205'],
}, { attachment: 'end', wide: true, behindNeck: true }) satisfies SideExercise;
