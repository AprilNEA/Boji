// Machine single-leg leg extension, side view. Sit tall with the knee aligned to the machine pivot and hands on the handles.
// The active lower shin presses the pad from about 90° of knee bend to a near-straight knee, then lowers under control.
// The thigh stays on the seat. The inactive leg remains bent behind the working leg and does not drive the lever.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math/vec2.ts';
import { solve, type LimbPair, type Pose } from '@/rig/side.ts';
import { G } from '@/exercises/common.ts';
import { backrestAt, baseRail, hub, leverArm, pad, seatPad, tube, weightStack, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.4);
const SHIN_LOW = 92, SHIN_HIGH = 4;
const ARM = 70, ROLLER_OFF = 23;

const HX = 196;
const HIP: Vec2 = [HX, G - 132];
const KNEE: Vec2 = add(HIP, [94, 2]);
const SEAT_TOP = HIP[1] + 17;
const HANDLE: Vec2 = [HX + 30, SEAT_TOP - 4];

const legs = (shin: number): LimbPair => ({
  near: { a1: 1, a2: shin, foot: shin - 90 },
  // Keep the non-working leg flexed, so the moving lever clearly follows only the near shin.
  far: { a1: 1, a2: SHIN_LOW, foot: SHIN_LOW - 90 },
});
const upper = { hip: HIP, spine: { lumbar: -97, thoracic: -101 }, neck: -93, head: -90 };
const pose = (shin: number): Pose => ({
  ...upper,
  legs: legs(shin),
  arms: {
    near: { target: HANDLE, side: [-1, 0.2], hand: 90 },
    far: { target: add(HANDLE, [-3, -1]), side: [-1, 0.2], hand: 90 },
  },
});
const probe = solve(pose(SHIN_LOW));
const rest = backrestAt(probe, 0.55);
const stack = weightStack({ x: rest.c[0] - 92, top: G - 300, lift: (t) => 30 * tl.at(t).p });
const shinAt = (t: number): number => lerp(SHIN_LOW, SHIN_HIGH, tl.at(t).p);

export default {
  id: 'machine-single-leg-leg-extension',
  name: '器械单腿腿屈伸',
  tl,
  meta: {
    en: 'Machine Single-Leg Leg Extension',
    family: 'leg-extension',
    equipment: ['machine'],
    sources: ['fe:Single-Leg_Leg_Extension'],
  },
  muscles: [{ m: 'quads', side: 'near' }],
  props: (pal) => ({
    back: [
      ...stack.fixed(pal),
      baseRail(pal, stack.box[0] - 6, KNEE[0] + 70),
      tube(pal, 'stack-link', [stack.box[1] - 4, G - 300 + 12], [rest.c[0] - 10, G - 300 + 12], { dark: true, w: 10 }),
      tube(pal, 'back-post', [rest.c[0] - 14, G - 5], [rest.c[0] - 10, rest.c[1]], { w: 16 }),
      tube(pal, 'seat-post', [HX + 30, G - 5], [HX + 30, SEAT_TOP + 10], { dark: true, w: 16 }),
      tube(pal, 'pivot-post', [KNEE[0] + 46, G - 5], KNEE, { w: 16 }),
      tube(pal, 'handle', [HX + 8, HANDLE[1] + 2], [HX + 58, HANDLE[1] + 2], { dark: true, w: 9 }),
      pad(pal, 'backrest', rest.c, rest.size, rest.rot),
      seatPad(pal, (HIP[0] - 38 + KNEE[0] - 8) / 2, SEAT_TOP, KNEE[0] - 8 - (HIP[0] - 38)),
      ...hub(pal, 'pivot', KNEE, 24),
    ],
  }),
  propsBox: [stack.box[0], KNEE[0] + 110],
  dynamic: [
    stack.dynamic,
    leverArm({
      nm: 'Single-Leg Extension Arm',
      pivot: KNEE,
      length: ARM,
      angle: (_J, t) => shinAt(t),
      extra: (pal) => [
        { kind: 'box', nm: 'roller-stub', color: pal.metalDark, c: [ARM, -ROLLER_OFF / 2], s: [9, ROLLER_OFF], r: 4 },
        { kind: 'oval', nm: 'roller', color: pal.pad, c: [ARM, -ROLLER_OFF], s: [30, 30] },
        { kind: 'oval', nm: 'roller-hub', color: pal.metalDark, c: [ARM, -ROLLER_OFF], s: [9, 9] },
      ],
    }),
  ],
  pose: (t) => pose(shinAt(t)),
} satisfies SideExercise;
