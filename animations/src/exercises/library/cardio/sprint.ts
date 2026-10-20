// Sprint, side view. The runner leans forward and drives one knee high while the opposite arm pumps hard.
// The rear foot pushes from the ground before it recovers quickly under the hips.
import type { SideExercise } from '@/exercise.ts';
import { cardioTL, sideRunPose } from './_cardio-1.ts';

export default {
  id: 'sprint',
  name: '冲刺跑',
  tl: cardioTL(0.62),
  poster: 0.25,
  meta: { en: 'Sprint', family: 'cardio', equipment: ['bodyweight'], sources: ['hz:0858'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.75 }, { m: 'calves', side: 'both', scale: 0.65 }, { m: 'abs', scale: 0.35 }],
  pose: (t) => sideRunPose(t, { stride: 43, lift: 62, lean: -68, hipY: 262, forefoot: 5 }),
} satisfies SideExercise;
