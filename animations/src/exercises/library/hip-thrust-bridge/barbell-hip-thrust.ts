// Start with the shoulder blades on a bench, both feet flat and a loaded bar across the hip crease.
// Drive through the feet to raise the bar and pelvis until the trunk and thighs form one line.
// The upper back stays on the bench, both feet stay planted and both hands steady the bar.
import type { SideExercise } from '@/exercise.ts';
import { barbell, flatBench } from '@/exercises/equipment/index.ts';
import { barHoldArms, hipBar, hipThrustPose, bridgeTL } from './_hip-thrust-bridge.ts';

const tl = bridgeTL();
const bench = flatBench({ view: 'side', x: 125, top: 90, length: 170 });

export default {
  id: 'barbell-hip-thrust', name: '杠铃臀推', tl,
  meta: { en: 'Barbell Hip Thrust', family: 'hip-thrust-bridge', equipment: ['barbell', 'bench'], sources: ['fe:Barbell_Hip_Thrust', 'hz:3562', 'hz:0058'] },
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.6 }, { m: 'quads', side: 'both', scale: 0.35 }],
  props: (pal) => ({ back: bench.draw(pal) }), propsBox: bench.box,
  dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: hipBar(J) }) })],
  pose: (t) => hipThrustPose(tl.at(t).p, barHoldArms),
} satisfies SideExercise;
