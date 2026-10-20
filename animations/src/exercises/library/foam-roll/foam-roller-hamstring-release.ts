// Sit with the posterior thigh on the roller and the hands behind the torso.
// Lift the hips and shift the pressure to one relaxed hamstring.
// Roll between the back of the knee and the lower glute while the other foot supports.
import type { SideExercise } from '@/exercise.ts';
import { seatedLegRoll } from './_foam-roll.ts';

export default seatedLegRoll({
  id: 'foam-roller-hamstring-release', name: '泡沫轴腘绳肌放松', en: 'Foam Roller Hamstring Release', sources: ['fe:Hamstring-SMR'],
}, 'hamstring') satisfies SideExercise;
