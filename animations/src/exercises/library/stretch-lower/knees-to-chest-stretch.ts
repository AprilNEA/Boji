// Start supine with long legs, arms at the sides, and the lumbar spine on the mat.
// Draw both knees to the chest, deeply fold the knees, and hold each shin with one hand.
// Hold targets: about 130° of hip flexion and 150° of knee flexion; the back stays down.
import type { SideExercise } from '@/exercise.ts';
import { lerp, lerpV, polar } from '@/math/vec2.ts';
import { keyframes } from '@/math/timeline.ts';
import type { Joints, Pose } from '@/rig/side.ts';
import { libraryMeta, lowerStretch, supineBase } from './_stretch-lower-1.ts';

const armAngle = keyframes([[0, 0], [0.72, -48], [1, -42]]);
const armReach = keyframes([[0, 118], [0.72, 94], [1, 100]]);
const shinContact = keyframes([[0, 0], [0.72, 0], [1, 1]]);

function wristTarget(shoulder: Joints['S'], knee: Joints['knee_n'], ankle: Joints['ankle_n'], p: number) {
  const approach = polar(shoulder, armAngle(p), armReach(p));
  const shin = lerpV(knee, ankle, 0.42);
  return lerpV(approach, shin, shinContact(p));
}

function kneesToChest(p: number): Pose {
  const thigh = lerp(0, -133, p), shin = lerp(0, 18, p);
  const base = supineBase({
    near: { a1: thigh, a2: shin, foot: shin - 16 },
    far: { a1: thigh + 4, a2: shin - 4, foot: shin - 18 },
  });
  return {
    ...base,
    arms: {
      near: { target: (J) => wristTarget(J.S, J.knee_n, J.ankle_n, p), side: [0, -1] },
      far: { target: (J) => wristTarget(J.Sf, J.knee_f, J.ankle_f, p), side: [0, -1] },
    },
  };
}

export default lowerStretch({
  id: 'knees-to-chest-stretch', name: '仰卧抱膝拉伸',
  meta: libraryMeta('Knees-to-Chest Stretch', ['bodyweight'], ['hz:1418']),
  muscles: [{ m: 'glutes', side: 'both' }, { m: 'hamstrings', side: 'both', scale: 0.35 }],
  pose: kneesToChest,
}) satisfies SideExercise;
