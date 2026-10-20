// Start on the edge of a bench with one heel fixed on the floor and the other foot under the seat.
// The torso hinges forward from the hips while the extended knee remains long and the heel stays grounded.
import type { SideExercise } from '@/exercise.ts';
import { flatBench } from '@/exercises/equipment/index.ts';
import { benchProps, chairLongLeg, libraryMeta, lowerStretch } from './_stretch-lower-1.ts';

const bench = flatBench({ view: 'side', x: 170, top: 84, length: 155 });
export default lowerStretch({
  id: 'seated-chair-hamstring-stretch', name: '坐姿椅上腘绳肌拉伸',
  meta: libraryMeta('Seated Chair Hamstring Stretch', ['bench'], ['hz:1548']),
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'calves', side: 'near', scale: 0.3 }],
  props: benchProps(bench.draw), propsBox: bench.box, pose: chairLongLeg,
}) satisfies SideExercise;
