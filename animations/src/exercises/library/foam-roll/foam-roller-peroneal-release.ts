// Lie on one side with the roller against the outside of the lower leg.
// Support the torso on the forearm and cross the upper foot in front.
// Lift the hips and roll from above the ankle to below the knee.
import type { SideExercise } from '@/exercise.ts';
import { sideLegRoll } from './_foam-roll.ts';

export default sideLegRoll({
  id: 'foam-roller-peroneal-release', name: '泡沫轴腓骨肌放松', en: 'Foam Roller Peroneal Release', sources: ['fe:Peroneals-SMR'],
}, 'lower-leg') satisfies SideExercise;
