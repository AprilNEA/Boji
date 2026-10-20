// Scissor jump, front view. The athlete jumps vertically and crosses the legs in the air.
// The feet land softly in the exchanged order, then repeat to the other side without a pause.
import type { FrontExercise } from '@/exercise.ts';
import { cardioTL, frontScissorPose } from './_cardio-1.ts';

export default {
  id: 'scissor-jump',
  name: '交叉跳',
  view: 'front',
  tl: cardioTL(0.8),
  poster: 0.33,
  meta: { en: 'Scissor Jump', family: 'cardio', equipment: ['bodyweight'], sources: ['hz:3219'] },
  muscles: [{ m: 'quads', side: 'both' }, { m: 'calves', side: 'both', scale: 0.7 }, { m: 'hamstrings', side: 'both', scale: 0.35, region: { view: 'front', part: 'thigh', c: [0, 48], s: [18, 48] } }],
  pose: frontScissorPose,
} satisfies FrontExercise;
