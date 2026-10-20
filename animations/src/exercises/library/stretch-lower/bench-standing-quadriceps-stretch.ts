// Start standing close to a bench with one rear foot resting on its pad.
// The front foot remains planted and the supporting knee stays softly bent.
import type { SideExercise } from '@/exercise.ts';
import { flatBench } from '@/exercises/equipment/index.ts';
import { benchProps, benchStandingQuad, libraryMeta, lowerStretch } from './_stretch-lower-1.ts';

const bench = flatBench({ view: 'side', x: 145, top: 90, length: 120 });
export default lowerStretch({
  id: 'bench-standing-quadriceps-stretch', name: '站姿后脚垫高股四头肌拉伸',
  meta: libraryMeta('Bench Standing Quadriceps Stretch', ['bench'], ['fe:Standing_Elevated_Quad_Stretch']),
  muscles: [{ m: 'quads', side: 'far' }, { m: 'hipFlexor', side: 'far', scale: 0.45 }],
  props: benchProps(bench.draw), propsBox: bench.box, pose: benchStandingQuad,
}) satisfies SideExercise;
