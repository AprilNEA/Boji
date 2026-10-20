// Start with the upper back against a bench and both feet flat on the floor.
// Extend the hips upward to a straight trunk-to-thigh line, then return under control.
// The upper back remains supported on the bench and both feet remain planted.
import type { SideExercise } from '@/exercise.ts';
import { flatBench } from '@/exercises/equipment/index.ts';
import { benchSupportArms, hipThrustPose, bridgeTL } from './_hip-thrust-bridge.ts';

const tl = bridgeTL();
const bench = flatBench({ view: 'side', x: 125, top: 90, length: 170 });

export default {
  id: 'bench-hip-thrust', name: '凳上臀推', tl,
  meta: { en: 'Bench Hip Thrust', family: 'hip-thrust-bridge', equipment: ['bench'], sources: ['hz:0130', 'hz:3523'] },
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.6 }],
  props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
  pose: (t) => hipThrustPose(tl.at(t).p, benchSupportArms),
} satisfies SideExercise;
