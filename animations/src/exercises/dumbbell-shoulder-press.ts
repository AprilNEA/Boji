// 坐姿哑铃推举 (dumbbell-shoulder-press). Seated on an upright bench, neutral grip.
// The dumbbells start at shoulder height with the elbows forward and the forearms vertical,
// then press up until the arms are straight over the shoulders. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import type { Palette } from '@/palettes.ts';
import { add, lerpV, type Vec2 } from '@/math.ts';
import { solve, type LimbPair } from '@/rig.ts';
import { A, G } from './common.ts';
import { backrestAt, dumbbell, workTL } from '@/exercises/equipment/index.ts';

const pressTL = workTL(0.3);

const SP = (() => {
  const hx = 236, hip: Vec2 = [hx, G - 104];
  const legs: LimbPair = {
    near: { target: [hx + 100, G - A], foot: 0, side: [0, -1] },
    far: { target: [hx + 94, G - A], foot: 0, side: [0, -1] },
  };
  const base = { hip, spine: { lumbar: -93, thoracic: -95 }, neck: -90, head: -89, legs };
  const probe = solve({ ...base, arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } } });
  const S = probe.S;
  // Bottom: dumbbells at shoulder height, ahead of the face; the forearms tilt forward about 17°.
  // Top: arm straight with a soft elbow, hands over the shoulders.
  const bottom: Vec2 = add(S, [42, 4]), top: Vec2 = add(S, [5, -122]);
  const rest = backrestAt(probe, 0.55, 9, [18, 168], 18);
  const seatY = G - 79;
  return { hx, base, bottom, top, rest, seatY };
})();

const pressArm = (p: number, d: Vec2) => ({
  target: add(lerpV(SP.bottom, SP.top, p), d),
  side: [1, 0.5] as Vec2, // elbows forward and down
  hand: -88,
});

const restBottom = SP.rest.c[1] + SP.rest.size[1] / 2;

const dumbbellShoulderPress = {
  id: 'dumbbell-shoulder-press', name: '坐姿哑铃推举', tl: pressTL,
  muscles: [{ m: 'delts', side: 'both' }, { m: 'triceps', side: 'both', scale: 0.6 }],
  props: (pal: Palette) => ({
    back: [
      { kind: 'box', nm: 'bench-base', color: pal.metalDark, c: [SP.hx - 8, G - 4], s: [150, 8], r: 3 },
      { kind: 'box', nm: 'back-post', color: pal.metal, c: [SP.rest.c[0], (restBottom + G - 8) / 2], s: [8, G - 8 - restBottom + 4], r: 3 },
      { kind: 'box', nm: 'seat-post', color: pal.metal, c: [SP.hx + 6, (SP.seatY + G) / 2], s: [10, G - SP.seatY - 8], r: 3 },
      { kind: 'box', nm: 'backrest', color: pal.pad, c: SP.rest.c, s: SP.rest.size, r: 9, rot: SP.rest.rot },
      { kind: 'box', nm: 'seat', color: pal.pad, c: [SP.hx + 8, SP.seatY], s: [96, 16], r: 8 },
    ],
  }),
  propsBox: [SP.rest.c[0] - 12, SP.hx + 70],
  dynamic: [dumbbell('f', 'profile'), dumbbell('n', 'profile')],
  pose(t) {
    const { p } = pressTL.at(t);
    return {
      ...SP.base,
      arms: { near: pressArm(p, [0, 0]), far: pressArm(p, [-3, -1]) },
    };
  },
} satisfies Exercise;

export default dumbbellShoulderPress;
