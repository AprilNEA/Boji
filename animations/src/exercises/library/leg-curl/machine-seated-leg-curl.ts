// Machine seated leg curl, side view. Sit against the backrest with the lap pad securing both thighs above the knees.
// The lower-leg roller begins behind the calves with straight knees, then follows both shins under the seat to about 70°.
// The torso, hips, thighs, lap pad, and side handles stay fixed while the lever and stack move.
import type { SideExercise } from '@/exercise.ts';
import { lerp, type Vec2 } from '@/math.ts';
import { baseRail, hub, leverArm, pad, rollerEnd, seatPad, tube, weightStack, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.4);
const HIP: Vec2 = [185, 320];
const KNEE: Vec2 = [279, 322];
const HANDLE: Vec2 = [220, 330];
const shin = (t: number): number => lerp(0, 110, tl.at(t).p);
const stack = weightStack({ x: 449, top: 132, lift: (t) => 28 * tl.at(t).p });

export default {
  id: 'machine-seated-leg-curl',
  name: '器械坐姿腿弯举',
  tl,
  meta: {
    en: 'Machine Seated Leg Curl', family: 'leg-curl', equipment: ['machine'],
    sources: ['fe:Seated_Leg_Curl', 'hz:0599', 'hz:3195'],
  },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'calves', side: 'both', scale: 0.3 }],
  props: (pal) => ({
    back: [
      ...stack.fixed(pal),
      baseRail(pal, 102, stack.box[1]),
      tube(pal, 'stack-link', [stack.box[0] + 7, 288], [KNEE[0] + 8, 288], { dark: true, w: 10 }),
      tube(pal, 'seat-post', [205, 447], [205, 350], { w: 14 }),
      tube(pal, 'pivot-post', [KNEE[0], 447], KNEE, { w: 14 }),
      tube(pal, 'handle-rail', [202, 348], HANDLE, { dark: true, w: 9 }),
      seatPad(pal, 223, 337, 118),
      pad(pal, 'backrest', [164, 271], [18, 142], -2),
      pad(pal, 'lap-pad', [244, 304], [92, 22]),
      ...hub(pal, 'curl-pivot', KNEE, 22),
    ],
  }),
  propsBox: [90, stack.box[1]],
  dynamic: [
    stack.dynamic,
    leverArm({
      nm: 'Seated Curl Lever', pivot: KNEE, length: 72, angle: (_J, t) => shin(t), z: 'back',
      extra: (pal) => rollerEnd(pal, 'lower-leg-roller', [72, 0], 31),
    }),
  ],
  pose: (t) => {
    const a = shin(t);
    return {
      hip: HIP,
      spine: { lumbar: -95, thoracic: -98 },
      neck: -93,
      head: -90,
      legs: {
        near: { a1: 1, a2: a, foot: a - 90 },
        far: { a1: 1, a2: a, foot: a - 90 },
      },
      arms: {
        near: { target: HANDLE, side: [-1, 0.3], hand: 90 },
        far: { target: [HANDLE[0] - 4, HANDLE[1] + 2], side: [-1, 0.3], hand: 90 },
      },
    };
  },
} satisfies SideExercise;
