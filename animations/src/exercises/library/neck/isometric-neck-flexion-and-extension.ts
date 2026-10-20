// Stand upright with the feet fixed and the cervical spine in its neutral, vertical position.
// Both hands resist at the forehead, then at the back of the head, without moving the head or torso.
// The hands briefly return to rest between holds so the two resistance directions remain clear.
import type { SideExercise } from '@/exercise.ts';
import { add, clamp, lerpV, smooth, type Vec2 } from '@/math.ts';
import type { Joints } from '@/rig.ts';
import { A, G, standLegs } from '@/exercises/common.ts';

// A 183.8 px hip-to-ankle distance keeps the planted standing knees near 175°.
const HIP: Vec2 = [254, G - A - 183.8];
const ramp = (t: number, from: number, to: number): number => smooth(clamp((t - from) / (to - from), 0, 1));

function foreheadHold(t: number): number {
  if (t < 0.30) return 1;
  if (t < 0.40) return 1 - ramp(t, 0.30, 0.40);
  return t < 0.90 ? 0 : ramp(t, 0.90, 1);
}

function backHold(t: number): number {
  if (t < 0.40 || t >= 0.90) return 0;
  if (t < 0.50) return ramp(t, 0.40, 0.50);
  if (t < 0.80) return 1;
  return 1 - ramp(t, 0.80, 0.90);
}

function wrist(J: Joints, far: boolean, forehead: number, back: number): Vec2 {
  const shoulder = far ? J.Sf : J.S;
  const rest = add(shoulder, [36, 67]);
  // Offset the two wrists vertically, so both palms read as separate hands in the profile view.
  const dy = far ? 8 : -6;
  // Arm IK is solved before the head joint. The upright head center is 41 px above the neck base.
  const front = add(J.N, [27, -41 + dy]);
  const rear = add(J.N, [-23, -41 + dy]);
  // Reach the rear contact over the crown of the head. A direct diagonal would pass through the shoulder joint.
  const crown = add(J.N, [10, -76 + dy]);
  const rearPath = back < 0.5
    ? lerpV(rest, crown, back * 2)
    : lerpV(crown, rear, (back - 0.5) * 2);
  return back > 0 ? rearPath : lerpV(rest, front, forehead);
}

export default {
  id: 'isometric-neck-flexion-and-extension',
  name: '颈部前后等长抗阻',
  tl: { total: 8 },
  meta: {
    en: 'Isometric Neck Flexion and Extension', family: 'neck', equipment: ['bodyweight'],
    sources: ['fe:Isometric_Neck_Exercise_-_Front_And_Back'],
  },
  muscles: [{ m: 'neck', e: (t) => 0.22 + 0.73 * Math.max(foreheadHold(t), backHold(t)) }],
  poster: 0.15,
  pose(t) {
    const front = foreheadHold(t), back = backHold(t);
    return {
      hip: HIP,
      spine: { lumbar: -90, thoracic: -90 }, neck: -90, head: -90,
      legs: standLegs(HIP[0], 0),
      arms: {
        near: { target: (J) => wrist(J, false, front, back), side: [0, 1], hand: 90 },
        far: { target: (J) => wrist(J, true, front, back), side: [0, 1], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
