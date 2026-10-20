// Start tall with both hands on the sledge and the head of the hammer overhead.
// Hinge through the hips while the hammer travels down into the center of the tire.
// The feet remain planted and the tire remains fixed on the floor during each strike.
import type { SideExercise } from '@/exercise.ts';
import { sledgehammerSlam } from './_carry-strongman.ts';

export default sledgehammerSlam({
  id: 'sledgehammer-slam', name: '大锤砸击', en: 'Sledgehammer Slam',
  equipment: ['other'], sources: ['hz:1496'],
  muscles: [{ m: 'abs' }, { m: 'delts', side: 'both', scale: 0.6 }, { m: 'forearms', side: 'both', scale: 0.5 }, { m: 'obliques', scale: 0.45 }],
}, false) satisfies SideExercise;
