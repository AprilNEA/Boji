// Start on hands and knees with both support points fixed on the mat.
// One knee flexes behind the body as the same-side hand holds the foot and the hip stays extended.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, quadrupedQuad } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'quadruped-quadriceps-stretch', name: '四点跪姿股四头肌拉伸',
  meta: libraryMeta('Quadruped Quadriceps Stretch', ['bodyweight'], ['fe:All_Fours_Quad_Stretch', 'hz:1512']),
  muscles: [{ m: 'quads', side: 'near' }, { m: 'hipFlexor', side: 'near', scale: 0.45 }],
  pose: quadrupedQuad,
}) satisfies SideExercise;
