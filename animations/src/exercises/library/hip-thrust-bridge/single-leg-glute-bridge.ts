// Start supine with one heel planted while the free knee is held toward the chest.
// Press through the planted heel to lift the pelvis into a bridge, then lower with control.
// The supporting foot and neck base stay fixed, and the raised knee remains flexed.
import type { SideExercise } from '@/exercise.ts';
import type { LimbPair } from '@/rig/side.ts';
import { lerp } from '@/math/vec2.ts';
import { bridgeArms, bridgePose, bridgeTL, BRIDGE_ANKLE } from './_hip-thrust-bridge.ts';

const tl = bridgeTL();
const legs = (p: number): LimbPair => ({
  near: { target: BRIDGE_ANKLE, foot: 0, side: [0, -1] },
  // The raised thigh follows the torso toward the chest while the shin stays folded above the body at about 60°.
  far: { a1: lerp(176, 138, p), a2: lerp(-64, -102, p), foot: lerp(-64, -102, p) },
});

export default {
  id: 'single-leg-glute-bridge', name: '单腿臀桥', tl, mat: true,
  meta: { en: 'Single-Leg Glute Bridge', family: 'hip-thrust-bridge', equipment: ['bodyweight', 'mat'], sources: ['fe:Single_Leg_Glute_Bridge'] },
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'near', scale: 0.7 }],
  pose: (t) => {
    const p = tl.at(t).p;
    return bridgePose(p, legs(p), bridgeArms);
  },
} satisfies SideExercise;
