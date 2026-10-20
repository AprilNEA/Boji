// Start supine with bent knees and a padded loaded bar across the hip crease.
// Drive through both heels to extend the hips, then lower the bar and pelvis together.
// The upper back and both feet stay on the floor while both hands secure the bar.
import type { SideExercise } from '@/exercise.ts';
import { barbell } from '@/exercises/equipment/index.ts';
import { barHoldArms, bridgePose, bridgeTL, hipBar } from './_hip-thrust-bridge.ts';

const tl = bridgeTL();

export default {
  id: 'barbell-glute-bridge', name: '杠铃臀桥', tl, mat: true,
  meta: { en: 'Barbell Glute Bridge', family: 'hip-thrust-bridge', equipment: ['barbell', 'mat'], sources: ['fe:Barbell_Glute_Bridge', 'hz:1409'] },
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both', scale: 0.55 }, { m: 'lowerBack', scale: 0.3 }],
  dynamic: [barbell({ view: 'side', plate: 'medium', at: (J) => ({ p: hipBar(J) }) })],
  pose: (t) => bridgePose(tl.at(t).p, undefined, barHoldArms),
} satisfies SideExercise;
