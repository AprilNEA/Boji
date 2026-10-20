// Start inside the loaded frame with both hands gripping the central side handles.
// Lift through the heels with the chest up, then walk briskly with quick steps.
// The frame surrounds the lifter and stays level as the feet alternate.
import type { SideExercise } from '@/exercise.ts';
import { rickshawCarry } from './_carry-strongman.ts';

export default rickshawCarry({
  id: 'rickshaw-frame-carry', name: '框架负重行走', en: 'Rickshaw Frame Carry',
  equipment: ['other'], sources: ['fe:Rickshaw_Carry'],
  muscles: [{ m: 'forearms', side: 'both' }, { m: 'quads', side: 'both', scale: 0.65 }, { m: 'traps', scale: 0.45 }, { m: 'lowerBack', scale: 0.4 }],
}) satisfies SideExercise;
