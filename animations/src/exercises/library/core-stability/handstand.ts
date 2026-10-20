// Plant both hands at shoulder width with the fingers pointing forward.
// Stack the wrists, shoulders, hips and ankles while the elbows remain locked.
// A small side-to-side correction shows balance without losing the vertical line.
import type { SideExercise } from '@/exercise.ts';
import { handstandPose, holdWave } from './_core-stability-2.ts';

export default {
  id: 'handstand',
  name: '手倒立',
  tl: { total: 4 },
  mat: true,
  meta: { en: 'Handstand', family: 'core-stability', equipment: ['bodyweight'], sources: ['hz:3302'] },
  muscles: [
    { m: 'triceps', side: 'both', e: () => 0.9 }, { m: 'delts', side: 'both', scale: 0.72, e: () => 0.8 },
    { m: 'abs', scale: 0.55, e: () => 0.62 },
  ],
  poster: 0.25,
  pose: (t) => handstandPose((holdWave(t) - 0.5) * 2),
} satisfies SideExercise;
