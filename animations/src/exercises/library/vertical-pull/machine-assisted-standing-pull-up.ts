// Stand on the counterweighted platform and hold the wide overhand handles.
// Pull the body upward with the torso long, then lower with control.
import type { FrontExercise } from '@/exercise.ts';
import { frontPullUp } from './_vertical-pull-1.ts';

export default frontPullUp({
  id: 'machine-assisted-standing-pull-up', name: '器械辅助站姿引体向上', en: 'Machine Assisted Standing Pull-Up',
  equipment: ['machine'], sources: ['hz:1432'],
}, { assisted: true, standingAssist: true }) satisfies FrontExercise;
