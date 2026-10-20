// Running in place, side view. The athlete jogs upright with alternating knee lift and opposite arm swing.
// Each foot lands softly under the body before the other leg cycles forward.
import type { SideExercise } from '@/exercise.ts';
import { cardioTL, sideRunPose } from './_cardio-1.ts';

export default {
  id: 'running-in-place',
  name: '原地跑步',
  tl: cardioTL(0.9),
  poster: 0.25,
  meta: { en: 'Running in Place', family: 'cardio', equipment: ['bodyweight'], sources: ['hz:0685', 'hz:0684'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.55 }, { m: 'calves', side: 'both', scale: 0.55 }],
  pose: (t) => sideRunPose(t, { stride: 30, lift: 35, lean: -82, hipY: 258, forefoot: 6 }),
} satisfies SideExercise;
