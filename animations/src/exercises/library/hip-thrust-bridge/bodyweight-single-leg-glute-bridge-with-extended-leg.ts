// Start supine with one heel planted and the opposite leg extended straight at hip height.
// The planted heel raises the pelvis into a straight bridge without dropping the extended leg.
// The supporting foot and neck base stay fixed on the mat.
import type { SideExercise } from '@/exercise.ts';
import type { LimbPair } from '@/rig/side.ts';
import { bridgeArms, bridgePose, bridgeTL, BRIDGE_ANKLE } from './_hip-thrust-bridge.ts';

const tl = bridgeTL();
const legs: LimbPair = {
  near: { target: BRIDGE_ANKLE, foot: 0, side: [0, -1] },
  far: { a1: 0, a2: 0, foot: 0 },
};

export default {
  id: 'bodyweight-single-leg-glute-bridge-with-extended-leg', name: '直腿单腿臀桥', tl, mat: true,
  meta: { en: 'Bodyweight Single-Leg Glute Bridge with Extended Leg', family: 'hip-thrust-bridge', equipment: ['bodyweight', 'mat'], sources: ['hz:3645'] },
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'near', scale: 0.65 }, { m: 'quads', side: 'far', scale: 0.3 }],
  pose: (t) => bridgePose(tl.at(t).p, legs, bridgeArms),
} satisfies SideExercise;
