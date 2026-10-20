// Sit with the thighs secured and a narrow overhand grip on the pulley bar.
// Pull the bar to the upper chest while the torso stays still.
import type { SideExercise } from '@/exercise.ts';
import { sidePulldown } from './_vertical-pull-1.ts';

export default sidePulldown({
  id: 'cable-close-grip-pronated-lat-pulldown', name: '绳索窄握正手高位下拉', en: 'Cable Close-Grip Pronated Lat Pulldown',
  equipment: ['cable', 'machine'], sources: ['fe:Close-Grip_Front_Lat_Pulldown'],
}, { attachment: 'end' }) satisfies SideExercise;
