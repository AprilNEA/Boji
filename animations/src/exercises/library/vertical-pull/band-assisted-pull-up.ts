// Loop the resistance band over the bar and place one bent knee in the loop.
// Pull the chin over the bar while the band supports the rising body.
import type { SideExercise } from '@/exercise.ts';
import { sidePullUp } from './_vertical-pull-1.ts';

export default sidePullUp({
  id: 'band-assisted-pull-up', name: '弹力带辅助引体向上', en: 'Band-Assisted Pull-Up',
  equipment: ['band', 'pull-up-bar'], sources: ['fe:Band_Assisted_Pull-Up', 'hz:0970'],
}, { band: true }) satisfies SideExercise;
