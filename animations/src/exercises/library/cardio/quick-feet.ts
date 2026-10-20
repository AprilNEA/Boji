// Quick feet, side view. The athlete stays athletic and makes rapid, low alternating steps on the forefeet.
// The feet barely leave the ground and the knees remain softly bent throughout the loop.
import type { SideExercise } from '@/exercise.ts';
import { cardioTL, sideRunPose } from './_cardio-1.ts';

export default {
  id: 'quick-feet',
  name: '原地快速小碎步',
  tl: cardioTL(0.62),
  poster: 0.25,
  meta: { en: 'Quick Feet', family: 'cardio', equipment: ['bodyweight'], sources: ['hz:3552'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.75 }, { m: 'hamstrings', side: 'both', scale: 0.3 }],
  pose: (t) => sideRunPose(t, { stride: 9, lift: 8, lean: -88, hipY: 255, forefoot: 8 }),
} satisfies SideExercise;
