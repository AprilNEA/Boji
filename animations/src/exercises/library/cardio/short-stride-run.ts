// Short-stride run, side view. The runner uses quick, compact strides with a high but controlled knee drive.
// The torso stays tall and the arms pump opposite the legs without overreaching.
import type { SideExercise } from '@/exercise.ts';
import { cardioTL, sideRunPose } from './_cardio-1.ts';

export default {
  id: 'short-stride-run',
  name: '小步跑',
  tl: cardioTL(0.72),
  poster: 0.25,
  meta: { en: 'Short Stride Run', family: 'cardio', equipment: ['bodyweight'], sources: ['hz:3656'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.5 }, { m: 'calves', side: 'both', scale: 0.5 }],
  pose: (t) => sideRunPose(t, { stride: 16, lift: 42, lean: -80, hipY: 256, forefoot: 6 }),
} satisfies SideExercise;
