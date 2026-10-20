// Start side-lying with the lower knee bent in front of the torso for stability.
// The upper knee flexes behind the body as the upper hand draws the foot toward the glute.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, sideQuad } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'side-lying-quadriceps-stretch', name: '侧卧股四头肌拉伸',
  meta: libraryMeta('Side-Lying Quadriceps Stretch', ['bodyweight'], ['fe:On_Your_Side_Quad_Stretch', 'hz:0613']),
  muscles: [{ m: 'quads', side: 'far' }, { m: 'hipFlexor', side: 'far', scale: 0.4 }],
  pose: sideQuad,
}) satisfies SideExercise;
