// Sit on the roller with the knees bent and one ankle crossed over the opposite knee.
// Shift onto the buttock of the crossed leg and keep the planted foot as the base.
// Roll the upper glute briefly, then change to the other side.
import type { FrontExercise } from '@/exercise.ts';
import { piriformisRoll } from './_foam-roll.ts';

export default piriformisRoll({
  id: 'foam-roller-piriformis-release', name: '泡沫轴梨状肌放松', en: 'Foam Roller Piriformis Release', sources: ['fe:Piriformis-SMR'],
}) satisfies FrontExercise;
