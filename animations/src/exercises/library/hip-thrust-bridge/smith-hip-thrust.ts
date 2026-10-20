// Start with the shoulder blades on a bench, feet flat and the Smith bar at the hip crease.
// Press through the heels to lift the hips and bar vertically into a straight bridge.
// The upper back stays on the bench, the feet stay flat and the bar remains on its rail.
import type { SideExercise } from '@/exercise.ts';
import { barbell, flatBench, smithRails } from '@/exercises/equipment/index.ts';
import { barHoldArms, bridgeTL, hipThrustPose } from './_hip-thrust-bridge.ts';

const tl = bridgeTL();
const bench = flatBench({ view: 'side', x: 125, top: 90, length: 170 });
const rails = smithRails({ view: 'side', x: 288, top: 46 });

export default {
  id: 'smith-hip-thrust', name: '史密斯臀推', tl,
  meta: { en: 'Smith Hip Thrust', family: 'hip-thrust-bridge', equipment: ['smith', 'barbell', 'bench'], sources: ['hz:0756'] },
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.55 }, { m: 'abs', scale: 0.35 }],
  props: (pal) => ({ back: [...bench.draw(pal), ...rails.draw(pal)] }), propsBox: [bench.box[0], rails.box[1]],
  dynamic: [barbell({ view: 'side', plate: 'medium', nm: 'Smith Bar', at: (J) => ({ p: [288, J.H[1] - 8] }) })],
  pose: (t) => hipThrustPose(tl.at(t).p, barHoldArms),
} satisfies SideExercise;
