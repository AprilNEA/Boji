// Stand on the assisted platform with the hands holding the elevated handles.
// Pull the chin above the bar, then descend with the torso under control.
import type { SideExercise } from '@/exercise.ts';
import { sidePullUp } from './_vertical-pull-1.ts';

export default sidePullUp({
  id: 'machine-assisted-standing-chin-up', name: '器械辅助站姿反握引体向上', en: 'Machine Assisted Standing Chin-Up',
  equipment: ['machine'], sources: ['hz:1431'],
}, { assisted: true, standingAssist: true }) satisfies SideExercise;
