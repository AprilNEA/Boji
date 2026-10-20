// Start seated with soles together, knees open, and fingers interlocked behind the head.
// The spine curls forward as both elbows travel inside the thighs; the feet stay together.
import type { SideExercise } from '@/exercise.ts';
import { libraryMeta, lowerStretch, seatedButterfly } from './_stretch-lower-1.ts';

export default lowerStretch({
  id: 'seated-butterfly-and-back-stretch', name: '坐姿蝴蝶式背部拉伸',
  meta: libraryMeta('Seated Butterfly and Back Stretch', ['bodyweight'], ['fe:Groin_and_Back_Stretch']),
  muscles: [{ m: 'adductors', side: 'both' }, { m: 'lowerBack', scale: 0.45 }, { m: 'upperBack', scale: 0.3 }],
  pose: (p) => seatedButterfly(p, true),
}) satisfies SideExercise;
