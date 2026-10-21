// Start in a high bridge with both feet flat and the torso aligned with the thighs.
// Keep the hips level and lift each knee to a clear 90° bend in alternation.
// The planted foot and upper back stay fixed, while the raised foot stays neutral.
import type { SideExercise } from '@/exercise.ts';
import type { LimbPair } from '@/rig/side.ts';
import { lerp } from '@/math/vec2.ts';
import { breath } from '@/math/timeline.ts';
import { bridgePose, plantedBridgeLegs } from './_hip-thrust-bridge.ts';

const lift = (t: number, side: 'near' | 'far'): number => {
  if (side === 'near') return t < 0.5 ? breath(2 * t) : 0;
  return t < 0.5 ? 0 : breath(2 * t - 1);
};

const marchingArms: LimbPair = {
  near: { target: [295, 439], side: [0, 1], hand: 0 },
  far: { target: [295, 440], side: [0, 1], hand: 0 },
};

function marchingLegs(t: number): LimbPair {
  const near = lift(t, 'near'), far = lift(t, 'far');
  // Interpolate the thigh through its upward angle branch. The former -21° to 145° branch swept the knee
  // under the floor. At the top the thigh and shin make a visible 90° marching bend, with a neutral foot.
  const raised = (q: number, baseThigh: number, baseShin: number) => ({
    a1: lerp(baseThigh, -180, q), a2: lerp(baseShin, -90, q), foot: 0,
  });
  const planted = plantedBridgeLegs();
  return {
    near: near > 0 ? raised(near, -21.03, 65.24) : planted.near,
    far: far > 0 ? raised(far, -23.63, 69.4) : planted.far,
  };
}

export default {
  id: 'glute-bridge-march', name: '臀桥交替抬腿', tl: { total: 3.2 }, mat: true, poster: 0.25,
  meta: { en: 'Glute Bridge March', family: 'hip-thrust-bridge', equipment: ['bodyweight', 'mat'], sources: ['hz:3561'] },
  muscles: [{ m: 'glutes', e: () => 1 }, { m: 'hamstrings', side: 'both', scale: 0.55, e: () => 0.75 }, { m: 'hipFlexor', side: 'both', scale: 0.35, e: () => 0.6 }],
  pose: (t) => bridgePose(1, marchingLegs(t), marchingArms),
} satisfies SideExercise;
