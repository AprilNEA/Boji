// Machine lying leg curl, side view. The torso and hips stay on the long prone pad and the hands hold its front grips.
// The roller presses behind the lower calves. Both knees flex from straight to about 70° while the lever follows the shins.
// The bench, hips, thighs, and grips remain fixed; only the lever, shins, and stack move.
import type { SideExercise } from '@/exercise.ts';
import { baseRail, hub, leverArm, rollerEnd, tube, weightStack } from '@/exercises/equipment/index.ts';
import { curlAngle, curlTL, PRONE, proneCurlPose } from './_leg-curl.ts';

const stack = weightStack({ x: 449, top: 132, lift: (t) => 28 * curlTL.at(t).p });

export default {
  id: 'machine-lying-leg-curl',
  name: '器械俯卧腿弯举',
  tl: curlTL,
  meta: {
    en: 'Machine Lying Leg Curl', family: 'leg-curl', equipment: ['machine'],
    sources: ['fe:Lying_Leg_Curls', 'hz:0586'],
  },
  muscles: [{ m: 'hamstrings', side: 'both' }, { m: 'calves', side: 'both', scale: 0.3 }],
  props: (pal) => ({
    back: [
      ...PRONE.bench.draw(pal),
      ...stack.fixed(pal),
      baseRail(pal, PRONE.knee[0] - 42, stack.box[1]),
      tube(pal, 'stack-link', [stack.box[0] + 8, 286], [PRONE.knee[0] + 12, 286], { dark: true, w: 10 }),
      tube(pal, 'pivot-post', [PRONE.knee[0], 447], PRONE.knee, { w: 14 }),
      tube(pal, 'front-handle', [360, 319], PRONE.handle, { dark: true, w: 9 }),
      ...hub(pal, 'curl-pivot', PRONE.knee, 22),
    ],
  }),
  propsBox: [PRONE.bench.box[0], stack.box[1]],
  dynamic: [
    stack.dynamic,
    leverArm({
      nm: 'Leg Curl Lever', pivot: PRONE.knee, length: 72, angle: (_J, t) => curlAngle(t), z: 'back',
      extra: (pal) => rollerEnd(pal, 'calf-roller', [72, 0], 31),
    }),
  ],
  pose: (t) => proneCurlPose(curlAngle(t)),
} satisfies SideExercise;
