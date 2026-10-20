// Start seated with legs long and a transverse roller below the glutes.
// Recline so the roller travels from the low back toward the upper back.
// Keep the legs extended and the roller perpendicular to the spine.
import type { SideExercise } from '@/exercise.ts';
import { backRoll } from './_foam-roll.ts';

export default backRoll({
  id: 'foam-roller-back-roll', name: '泡沫轴背部放松', en: 'Foam Roller Back Roll', sources: ['hz:2208'],
}) satisfies SideExercise;
