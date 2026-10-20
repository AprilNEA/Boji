// Stand tall with both feet planted and keep the head centered over the torso.
// One hand presses the matching side of the head without any neck travel, then the other side repeats.
// The neck stays neutral; only the hands move between the relaxed position and the temple.
import type { FrontExercise } from '@/exercise.ts';
import { clamp, smooth } from '@/math.ts';
import { add3, lerp3, type Vec3 } from '@/math3.ts';
import { BODY } from '@/rig.ts';
import type { FSide, FrontJoints } from '@/front-rig.ts';

const ramp = (t: number, from: number, to: number): number => smooth(clamp((t - from) / (to - from), 0, 1));

/** Contact amount for the figure's left (screen-right) hand. The first and last frames match. */
function leftPress(t: number): number {
  if (t < 0.08) return 1 - ramp(t, 0, 0.08);
  if (t >= 0.63 && t < 0.73) return ramp(t, 0.63, 0.73);
  return t >= 0.73 ? 1 : 0;
}

/** Contact amount for the figure's right (screen-left) hand. */
function rightPress(t: number): number {
  if (t < 0.13 || t >= 0.58) return 0;
  if (t < 0.23) return ramp(t, 0.13, 0.23);
  if (t < 0.48) return 1;
  return 1 - ramp(t, 0.48, 0.58);
}

function wrist(J: FrontJoints, side: FSide, amount: number): Vec3 {
  const sign = side === 'l' ? 1 : -1;
  // Resting hands sit next to the hips. The working palm reaches the temple on its own side.
  const rest: Vec3 = [sign * 51, 210, 12];
  const temple = add3(J.headCenter, [sign * 27, 0, 16]);
  return lerp3(rest, temple, amount);
}

export default {
  id: 'isometric-neck-lateral-flexion',
  name: '颈部侧屈等长抗阻',
  view: 'front',
  tl: { total: 8 },
  meta: {
    en: 'Isometric Neck Lateral Flexion', family: 'neck', equipment: ['bodyweight'],
    sources: ['fe:Isometric_Neck_Exercise_-_Sides'],
  },
  muscles: [{ m: 'neck', e: (t) => 0.22 + 0.73 * Math.max(leftPress(t), rightPress(t)) }],
  // The left-side hold is the clearest still frame. The neutral head distinguishes an isometric hold from a side bend.
  poster: 0.86,
  pose(t) {
    const l = leftPress(t), r = rightPress(t);
    return {
      // 183.8 px gives standing knees about 175°, not the visibly soft 168° posture.
      pelvis: [0, BODY.ankleH + 183.8, 0],
      legs: {
        l: { target: [16, BODY.ankleH, 2] },
        r: { target: [-16, BODY.ankleH, 2] },
      },
      arms: {
        l: { target: (J) => wrist(J, 'l', l), pole: [8, 0, -1] },
        r: { target: (J) => wrist(J, 'r', r), pole: [-8, 0, -1] },
      },
    };
  },
} satisfies FrontExercise;
