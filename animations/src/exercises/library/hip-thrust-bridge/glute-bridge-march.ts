// Start in a high bridge with both feet flat and the torso aligned with the thighs.
// Keep the hips level while alternately drawing one bent knee toward the chest.
// The supporting foot and the upper back remain fixed on the floor.
import type { SideExercise } from '@/exercise.ts';
import type { LimbPair } from '@/rig.ts';
import { lerp } from '@/math.ts';
import { bridgeArms, bridgePose } from './_hip-thrust-bridge.ts';

const TAU = Math.PI * 2;
const lift = (t: number, sign: 1 | -1): number => Math.max(0, sign * Math.sin(TAU * t));

function marchingLegs(t: number): LimbPair {
  const near = lift(t, 1), far = lift(t, -1);
  // At q=0 these directions reproduce the planted high bridge. At q=1 the thigh draws toward the chest and
  // the knee remains about 60° flexed; this avoids the visually wrong ankle-to-hip collapse.
  const raised = (q: number, baseThigh: number, baseShin: number) => ({
    a1: lerp(baseThigh, 145, q), a2: lerp(baseShin, -95, q), foot: lerp(0, -95, q),
  });
  return { near: raised(near, -21.03, 65.24), far: raised(far, -23.63, 69.4) };
}

export default {
  id: 'glute-bridge-march', name: '臀桥交替抬腿', tl: { total: 3.2 }, mat: true, poster: 0.25,
  meta: { en: 'Glute Bridge March', family: 'hip-thrust-bridge', equipment: ['bodyweight', 'mat'], sources: ['hz:3561'] },
  muscles: [{ m: 'glutes', e: () => 1 }, { m: 'hamstrings', side: 'both', scale: 0.55, e: () => 0.75 }, { m: 'hipFlexor', side: 'both', scale: 0.35, e: () => 0.6 }],
  pose: (t) => bridgePose(1, marchingLegs(t), bridgeArms),
} satisfies SideExercise;
