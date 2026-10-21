// Start upright with the kettlebell racked at the right shoulder and the free hand relaxed.
// Bend left under the bell as the right arm reaches a vertical lockout and the left hand reaches the floor.
// At the floor touch, the hips remain above the knees, and both feet stay planted.
import type { FrontExercise } from '@/exercise.ts';
import { frontGripAt, kettlebell, workTL } from '@/exercises/equipment/index.ts';
import { add3, lerp3, type Vec3 } from '@/math/vec3.ts';
import { BODY } from '@/rig/side.ts';
import type { FrontJoints } from '@/rig/front.ts';

const TL = workTL(0.3);
// This torso-frame target lands the left fingertips on the floor at full side bend.
const FLOOR_HAND_OFFSET: Vec3 = [29, -113, -14];

export default {
  id: 'kettlebell-bent-press',
  name: '壶铃侧屈推举',
  view: 'front',
  tl: TL,
  meta: {
    en: 'Kettlebell Bent Press', family: 'vertical-press', equipment: ['kettlebell'], sources: ['fe:Bent_Press', 'hz:0524'],
  },
  muscles: [
    { m: 'obliques', scale: 1 }, { m: 'delts', scale: 0.65 },
    { m: 'triceps', scale: 0.45, region: { view: 'front', part: 'upper', c: [0, 35], s: [11, 29] } },
    { m: 'quads', scale: 0.3 },
  ],
  dynamic: [kettlebell<FrontJoints>((J) => ({ p: frontGripAt(J, 'r') }), 'face', 'front', 'Right kettlebell')],
  pose(t) {
    const p = TL.at(t).p;
    const roll = 68 * p;
    return {
      pelvis: lerp3([0, 194, 0], [15, 90, 0], p),
      spine: { roll, yaw: -12 * p },
      neck: { roll: -roll * 0.18, yaw: 12 * p },
      head: { roll: -roll * 0.3, yaw: 25 * p },
      legs: {
        l: { target: [30, BODY.ankleH, 2] },
        r: { target: [-30, BODY.ankleH, 2] },
      },
      arms: {
        r: {
          target: (J: FrontJoints) => add3(J.shoulder_r, lerp3([-52, 18, 68], [0, 125.5, 0], p)),
          pole: [-0.45, -0.35, -0.75], dir: [0, 1, 0],
        },
        l: {
          target: (J: FrontJoints) => add3(J.shoulder_l, lerp3([18, -112, 4], FLOOR_HAND_OFFSET, p)),
          pole: [0.5, -0.3, -0.8], dir: [0, -1, 0],
        },
      },
    };
  },
} satisfies FrontExercise;
