// Start lying supine on a flat bench with one leg hanging over the side.
// The hanging knee bends as the hand reaches to the foot; the lumbar spine stays supported by the pad.
import type { SideExercise } from '@/exercise.ts';
import { flatBench } from '@/exercises/equipment/index.ts';
import { benchProps, benchSupineQuad, libraryMeta, lowerStretch } from './_stretch-lower-1.ts';

const bench = flatBench({ view: 'side', x: 250, top: 90 });
export default lowerStretch({
  id: 'bench-supine-quadriceps-stretch', name: '凳上仰卧股四头肌拉伸',
  meta: libraryMeta('Bench Supine Quadriceps Stretch', ['bench'], ['fe:On-Your-Back_Quad_Stretch']),
  muscles: [{ m: 'quads', side: 'near' }, { m: 'hipFlexor', side: 'near', scale: 0.45 }],
  props: benchProps(bench.draw), propsBox: bench.box, pose: benchSupineQuad,
}) satisfies SideExercise;
