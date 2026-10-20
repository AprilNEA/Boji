// Start over a floor bar with bands looped under the rear half of the feet and over the bar.
// Pull from the hips and knees together, then finish by driving the hips into the bar.
// The side view keeps the bar close and uses a staggered depth cue for the wide sumo stance.
import type { SideExercise } from '@/exercise.ts';
import { barDeadlift, footBands } from './_hinge-1.ts';

export default barDeadlift({
  id: 'barbell-banded-sumo-deadlift', name: '杠铃弹力带相扑硬拉', en: 'Barbell Banded Sumo Deadlift',
  sources: ['fe:Sumo_Deadlift_with_Bands'], farDx: -18, equipment: ['barbell', 'band'], extra: footBands(),
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes' }, { m: 'adductors', side: 'far', scale: 0.65 }, { m: 'quads', side: 'both', scale: 0.55 }, { m: 'lowerBack', scale: 0.6 }, { m: 'forearms', side: 'both', scale: 0.3 }],
}) satisfies SideExercise;
