// Start tall with one dumbbell hanging beside each thigh.
// Take short alternating steps while both arms stay long and the torso stays upright.
// The dumbbells remain aligned with the hands and do not swing ahead of the body.
import type { SideExercise } from '@/exercise.ts';
import { dumbbellFarmersWalk } from './_carry-strongman.ts';

export default dumbbellFarmersWalk({
  id: 'dumbbell-farmers-walk', name: '哑铃农夫行走', en: "Dumbbell Farmer's Walk",
  equipment: ['dumbbell'], sources: ['hz:2133'],
  muscles: [{ m: 'quads', side: 'both' }, { m: 'forearms', side: 'both', scale: 0.6 }, { m: 'calves', side: 'both', scale: 0.45 }, { m: 'traps', scale: 0.35 }],
}) satisfies SideExercise;
