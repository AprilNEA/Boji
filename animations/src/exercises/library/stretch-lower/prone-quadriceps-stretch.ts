// Start prone with the free leg long and the working knee beginning to bend.
// The same-side hand reaches back to draw the heel toward the glute without lifting the pelvis.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, proneQuad } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'prone-quadriceps-stretch', name: '俯卧股四头肌拉伸',
  meta: libraryMeta('Prone Quadriceps Stretch', ['bodyweight'], ['hz:1713', 'hz:1714']),
  muscles: [{ m: 'quads', side: 'near' }, { m: 'hipFlexor', side: 'near', scale: 0.4 }],
  pose: proneQuad,
}) satisfies SideExercise;
