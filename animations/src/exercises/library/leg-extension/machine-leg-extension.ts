// Machine leg extension, side view. Seated with the back on a slightly reclined backrest, hands on the side
// handles. The knee joint lines up with the machine pivot and the roller pad sits on the lower shins, just above
// the ankles. From about 90° of knee bend the knees straighten fully, hold briefly, then lower under control.
// The thighs stay on the seat and the hips do not lift.
import type { SideExercise } from '@/exercise.ts';
import { add, lerp, type Vec2 } from '@/math.ts';
import { solve, type LimbPair, type Pose } from '@/rig.ts';
import { G } from '@/exercises/common.ts';
import { backrestAt, baseRail, hub, leverArm, pad, seatPad, tube, weightStack, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.4);
/** Shin direction at the bottom (slightly behind vertical, about 92° of knee bend) and at the top (knee straight). */
const SHIN_LOW = 92, SHIN_HIGH = 4;
/** Pivot to roller center along the shin, and the roller offset in front of the shin. */
const ARM = 70, ROLLER_OFF = 23;

const HX = 196;
const HIP: Vec2 = [HX, G - 132];
/** Thighs level on the seat: the knee sits at the front edge of the seat, on the machine pivot. */
const KNEE: Vec2 = add(HIP, [94, 2]);
const SEAT_TOP = HIP[1] + 17;

const legs = (shin: number): LimbPair => ({
  // Neutral ankle: the foot stays at a right angle to the shin, toes pointing away from the knee.
  near: { a1: 1, a2: shin, foot: shin - 90 },
  far: { a1: 1, a2: shin, foot: shin - 90 },
});
const upper = { hip: HIP, spine: { lumbar: -97, thoracic: -101 }, neck: -93, head: -90 };
/** Hands on the side handles, a little in front of the hips. */
const HANDLE: Vec2 = [HX + 30, SEAT_TOP - 4];
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
  id: 'machine-leg-extension',
  name: '器械腿屈伸',
  tl,
  meta: { en: 'Machine Leg Extension', family: 'leg-extension', equipment: ['machine'], sources: ['fe:Leg_Extensions', 'hz:0585'] },
  muscles: [{ m: 'quads', side: 'both' }],
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
    // The arm turns with the shin about the knee; its roller presses on the front of the lower shin.
    leverArm({
      nm: 'Leg Extension Arm', pivot: KNEE, length: ARM, angle: (_J, t) => shinAt(t),
      extra: (pal) => [
        { kind: 'box', nm: 'roller-stub', color: pal.metalDark, c: [ARM, -ROLLER_OFF / 2], s: [9, ROLLER_OFF], r: 4 },
        { kind: 'oval', nm: 'roller', color: pal.pad, c: [ARM, -ROLLER_OFF], s: [30, 30] },
        { kind: 'oval', nm: 'roller-hub', color: pal.metalDark, c: [ARM, -ROLLER_OFF], s: [9, 9] },
      ],
    }),
  ],
  pose: (t) => pose(shinAt(t)),
} satisfies SideExercise;
