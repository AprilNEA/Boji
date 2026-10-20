// Start between loaded farmer handles with the chest high and arms long.
// Lift through the heels, then take fast, controlled alternating steps.
// The handles remain beside the legs and the back stays straight throughout.
import type { SideExercise } from '@/exercise.ts';
import { farmersWalk } from './_carry-strongman.ts';

export default farmersWalk({
  id: 'farmers-walk', name: '农夫行走', en: "Farmer's Walk",
  equipment: ['other'], sources: ['fe:Farmers_Walk'],
  muscles: [{ m: 'forearms', side: 'both' }, { m: 'quads', side: 'both', scale: 0.6 }, { m: 'traps', scale: 0.5 }, { m: 'lowerBack', scale: 0.4 }],
}) satisfies SideExercise;
