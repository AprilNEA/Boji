// Machine kneeling leg curl, side view. Both knees rest on the pad and the chest stays supported while the hands hold the grips.
// The lower legs begin in line with the thighs, then flex upward until the knees are near 90°.
// The knee pad, torso, hips, upper legs, and hands stay fixed as the roller lever follows the lower legs.
import type { SideExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { baseRail, hub, leverArm, pad, rollerEnd, tube, weightStack, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.4);
const KNEE: [number, number] = [160, 310];
const HIP: [number, number] = [240, 260];
const HANDLE: [number, number] = [382, 297];
const shin = (t: number): number => lerp(148, 238, tl.at(t).p);
const stack = weightStack({ x: 448, top: 132, lift: (t) => 27 * tl.at(t).p });

export default {
  id: 'machine-kneeling-leg-curl',
  name: '器械跪姿腿弯举',
  tl,
  meta: { en: 'Machine Kneeling Leg Curl', family: 'leg-curl', equipment: ['machine'], sources: ['hz:0582'] },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'glutes', scale: 0.35 }],
  props: (pal) => ({
    back: [
      ...stack.fixed(pal),
      baseRail(pal, 108, stack.box[1]),
      tube(pal, 'stack-link', [stack.box[0] + 8, 288], [KNEE[0], 288], { dark: true, w: 10 }),
      tube(pal, 'knee-post', [KNEE[0], 447], [KNEE[0], 326], { w: 14 }),
      tube(pal, 'chest-post', [298, 447], [298, 286], { w: 14 }),
      tube(pal, 'handle-rail', [332, 302], HANDLE, { dark: true, w: 9 }),
      pad(pal, 'knee-pad', [KNEE[0], 326], [98, 26]),
      pad(pal, 'chest-pad', [300, 284], [145, 22]),
      ...hub(pal, 'curl-pivot', KNEE, 22),
    ],
  }),
  propsBox: [96, stack.box[1]],
  dynamic: [
    stack.dynamic,
    leverArm({
      nm: 'Kneeling Curl Lever', pivot: KNEE, length: 70, angle: (_J, t) => shin(t), z: 'back',
      extra: (pal) => rollerEnd(pal, 'foot-roller', [70, 0], 30),
    }),
  ],
  pose: (t) => ({
    hip: HIP,
    spine: { lumbar: 0, thoracic: 0 },
    neck: 0,
    head: 0,
    legs: {
      near: { a1: 148, a2: shin(t), foot: 0 },
      far: { a1: 148, a2: shin(t) - 2, foot: 0 },
    },
    arms: {
      near: { target: HANDLE, side: [1, 0.4], hand: 0 },
      far: { target: [HANDLE[0] - 4, HANDLE[1] + 2], side: [1, 0.4], hand: 0 },
    },
  }),
} satisfies SideExercise;
