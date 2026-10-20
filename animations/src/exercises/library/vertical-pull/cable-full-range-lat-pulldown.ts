// Begin with the arms long overhead while the thighs remain under the pad.
// Pull the bar to the upper chest through the full comfortable range.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-full-range-lat-pulldown', name: '绳索全程高位下拉', en: 'Cable Full-Range Lat Pulldown',
  equipment: ['cable', 'machine'], sources: ['hz:2330'],
}, { attachment: 'end', wide: true }) satisfies SideExercise;
