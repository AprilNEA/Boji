// Single-leg donkey calf raise with a hinged torso and both hands fixed on a wall.
// The working forefoot stays on the step while the heel rises; the free leg stays folded off the floor.
// The wall and step contacts remain fixed for balance.
import type { SideExercise } from '@/exercise.ts';
import { donkeyCalves } from './_calf-raise-1.ts';

export default donkeyCalves({
  id: 'single-leg-donkey-calf-raise', name: '单腿驴式提踵',
  meta: {
    en: 'Single-Leg Donkey Calf Raise', family: 'calf-raise', equipment: ['bodyweight', 'step', 'wall'],
    sources: ['hz:1386'],
  },
}, true) satisfies SideExercise;
