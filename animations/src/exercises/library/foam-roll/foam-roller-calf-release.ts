// Sit with the calf resting on the roller and the hands behind the torso.
// Press through the hands to lift the hips and roll below the knee to above the ankle.
// The other foot stays planted as support while the working leg remains relaxed.
import type { SideExercise } from '@/exercise.ts';
import { seatedLegRoll } from './_foam-roll.ts';

export default seatedLegRoll({
  id: 'foam-roller-calf-release', name: '泡沫轴小腿放松', en: 'Foam Roller Calf Release', sources: ['fe:Calves-SMR'],
}, 'calf') satisfies SideExercise;
