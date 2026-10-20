// Balance on the palms with locked elbows and the shoulders ahead of the wrists.
// The hips, knees and ankles stay in one horizontal line with both feet airborne.
// The hold uses a small control pulse only, so the full planche shape stays clear.
import type { SideExercise } from '@/exercise.ts';
import { fullPlanchePose, holdWave } from './_core-stability-2.ts';

export default {
  id: 'full-planche',
  name: '直体俄式挺身',
  tl: { total: 4 },
  mat: true,
  meta: { en: 'Full Planche', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3299'] },
  muscles: [
    { m: 'abs', e: (t) => 0.86 + 0.09 * holdWave(t) }, { m: 'delts', side: 'both', scale: 0.72, e: () => 0.78 },
    { m: 'triceps', side: 'both', scale: 0.64, e: () => 0.72 }, { m: 'pecs', scale: 0.42, e: () => 0.52 },
  ],
  poster: 0.25,
  pose: () => fullPlanchePose(),
} satisfies SideExercise;
