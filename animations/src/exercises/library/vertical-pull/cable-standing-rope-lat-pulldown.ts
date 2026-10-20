// Stand facing the high pulley with a rope held in a neutral two-hand grip.
// Pull both rope ends toward the sides without rounding the back.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-standing-rope-lat-pulldown', name: '绳索站姿绳把高位下拉', en: 'Cable Standing Rope Lat Pulldown',
  equipment: ['cable'], sources: ['hz:0177'],
}, { mode: 'standing', attachment: 'rope', neutral: true }) satisfies SideExercise;
