// Machine standing single-leg curl, side view. The torso leans about 40° into the chest pad and both hands hold the front grips.
// The working thigh stays pressed onto the thigh pad while its lower leg curls from straight to about 70°.
// The support foot remains flat, and the lever roller follows the working lower leg without lifting the thigh pad contact.
import type { SideExercise } from '@/exercise.ts';
import { lerp, type Vec2 } from '@/math/vec2.ts';
import { baseRail, hub, leverArm, pad, rollerEnd, tube, weightStack, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.4);
const HIP: Vec2 = [245, 255];
const KNEE: Vec2 = [277, 343];
const HANDLE: Vec2 = [370, 270];
const shin = (t: number): number => lerp(70, 180, tl.at(t).p);
const stack = weightStack({ x: 442, top: 130, lift: (t) => 26 * tl.at(t).p });

export default {
  id: 'machine-standing-single-leg-curl',
  name: '器械站姿单腿腿弯举',
  tl,
  meta: { en: 'Machine Standing Single-Leg Curl', family: 'leg-curl', equipment: ['machine'], sources: ['fe:Standing_Leg_Curl'] },
  muscles: [{ m: 'hamstrings', side: 'near' }, { m: 'glutes', scale: 0.35 }],
  props: (pal) => ({
    back: [
      ...stack.fixed(pal),
      baseRail(pal, 168, stack.box[1]),
      tube(pal, 'stack-link', [stack.box[0] + 7, 284], [KNEE[0] + 10, 284], { dark: true, w: 10 }),
      tube(pal, 'thigh-pad-post', [300, 447], [300, 360], { w: 14 }),
      tube(pal, 'chest-pad-post', [356, 447], [356, 228], { w: 14 }),
      tube(pal, 'handle-rail', [356, 258], HANDLE, { dark: true, w: 9 }),
      pad(pal, 'thigh-pad', [304, 359], [106, 26]),
      pad(pal, 'chest-pad', [348, 221], [26, 126], -48),
      ...hub(pal, 'curl-pivot', KNEE, 22),
    ],
  }),
  propsBox: [156, stack.box[1]],
  dynamic: [
    stack.dynamic,
    leverArm({
      nm: 'Standing Curl Lever', pivot: KNEE, length: 70, angle: (_J, t) => shin(t), z: 'back',
      extra: (pal) => rollerEnd(pal, 'calf-roller', [70, 0], 30),
    }),
  ],
  pose: (t) => {
    const a = shin(t);
    return {
      hip: HIP,
      // The support foot must remain flat; do not offset its hip behind the near hip.
      farHip: 0,
      spine: { lumbar: -50, thoracic: -52 },
      neck: -58,
      head: -62,
      legs: {
        near: { a1: 70, a2: a, foot: a - 90 },
        far: { a1: 90, a2: 90, foot: 0 },
      },
      arms: {
        near: { target: HANDLE, side: [1, 0.2], hand: 0 },
        far: { target: [HANDLE[0] - 4, HANDLE[1] + 2], side: [1, 0.2], hand: 0 },
      },
    };
  },
} satisfies SideExercise;
