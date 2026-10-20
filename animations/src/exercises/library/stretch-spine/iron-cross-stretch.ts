// Lie supine with the shoulders and arms held on the mat in a cross.
// Raise both straight legs, lower them as one unit to the side, then return under control.
import type { SideExercise } from '@/exercise.ts';
import { ironCrossPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'iron-cross-stretch', name: '仰卧十字转体拉伸', tl: stretchTL, mat: true,
  meta: { en: 'Iron Cross Stretch', family: 'stretch-spine', equipment: ['bodyweight', 'mat'], sources: ['hz:1419'] },
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.5 }, { m: 'obliques', scale: 0.35 }],
  poster: 0.44,
  pose: (t) => ironCrossPose(stretchTL.at(t).p),
} satisfies SideExercise;
