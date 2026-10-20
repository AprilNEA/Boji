// Donkey calf raise with the torso hinged forward, hands fixed on a wall, and both forefeet on a step.
// The heels travel from slightly below the step to a high calf contraction without knee bend.
// The wall and step contacts remain fixed.
import type { SideExercise } from '@/exercise.ts';
import { donkeyCalves } from './_calf-raise-1.ts';

export default donkeyCalves({
  id: 'donkey-calf-raise', name: '驴式提踵',
  meta: {
    en: 'Donkey Calf Raise', family: 'calf-raise', equipment: ['bodyweight', 'step', 'wall'],
    sources: ['hz:0284'],
  },
}, false) satisfies SideExercise;
