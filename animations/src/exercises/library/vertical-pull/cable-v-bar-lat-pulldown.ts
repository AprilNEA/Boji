// Sit beneath the thigh pad and hold the V-bar with palms facing each other.
// Pull the V-bar close to the upper chest, then return to the overhead stretch.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-v-bar-lat-pulldown', name: '绳索窄握对握高位下拉', en: 'Cable V-Bar Lat Pulldown',
  equipment: ['cable', 'machine'], sources: ['fe:V-Bar_Pulldown', 'hz:2616'],
}, { attachment: 'vbar', neutral: true }) satisfies SideExercise;
