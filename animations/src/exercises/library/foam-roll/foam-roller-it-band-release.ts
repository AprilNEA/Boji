// Lie on one side with the lower outer thigh on the roller.
// Cross the upper foot in front for balance and relax the lower leg.
// Roll from just above the knee toward the hip, pausing on tender points.
import type { SideExercise } from '@/exercise.ts';
import { sideLegRoll } from './_foam-roll.ts';

export default sideLegRoll({
  id: 'foam-roller-it-band-release', name: '泡沫轴髂胫束放松', en: 'Foam Roller IT Band Release', sources: ['fe:Iliotibial_Tract-SMR'],
}, 'thigh') satisfies SideExercise;
