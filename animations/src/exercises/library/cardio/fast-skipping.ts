// Fast skipping, side view. The athlete alternates a compact step-hop on each side with minimal air time.
// The stance foot stays near the floor while the opposite foot clears forward and the arms swing in opposition.
import type { SideExercise } from '@/exercise.ts';
import { cardioTL, sideRunPose } from './_cardio-1.ts';

export default {
  id: 'fast-skipping',
  name: '快速垫步跳',
  tl: cardioTL(0.72),
  poster: 0.25,
  meta: { en: 'Fast Skipping', family: 'cardio', equipment: ['bodyweight'], sources: ['fe:Fast_Skipping'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.7 }, { m: 'glutes', scale: 0.35 }],
  pose: (t) => sideRunPose(t, { stride: 20, lift: 22, lean: -84, hipY: 258, forefoot: 7 }),
} satisfies SideExercise;
