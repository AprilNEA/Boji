// Support the horizontal body on fixed palms with both elbows locked.
// Keep both legs straight and airborne in a wide fore-and-aft straddle.
// Use only a small balance correction, so the defining planche position stays clear.
import type { SideExercise } from '@/exercise.ts';
import { holdWave, straddlePlanchePose } from './_core-stability-2.ts';

export default {
  id: 'straddle-planche',
  name: '分腿俄式挺身',
  tl: { total: 4 },
  mat: true,
  meta: { en: 'Straddle Planche', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3298'] },
  muscles: [
    { m: 'abs', e: (t) => 0.86 + 0.09 * holdWave(t) }, { m: 'delts', side: 'both', scale: 0.72, e: () => 0.78 },
    { m: 'triceps', side: 'both', scale: 0.64, e: () => 0.72 }, { m: 'pecs', scale: 0.42, e: () => 0.52 },
  ],
  poster: 0.25,
  pose: () => straddlePlanchePose(),
} satisfies SideExercise;
