// 坐姿推胸 (chest-press). pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '../exercise.ts';
import type { Palette } from '../palettes.ts';
import { add, ang, dir, len, lerp, mul, sub, type Vec2 } from '../math.ts';
import { solve, type LimbPair, type Joints } from '../rig.ts';
import { A, G } from './common.ts';
import { backrestAt, weightStack, workTL } from './equipment.ts';

const chestTL = workTL(0.35);
const CP = (() => {
  const hx = 226, hip: Vec2 = [hx, G - 104];
  const legs: LimbPair = {
    near: { target: [hx + 100, G - A], foot: 0, side: [0, -1] },
    far: { target: [hx + 94, G - A], foot: 0, side: [0, -1] },
  };
  const base = { hip, spine: { lumbar: -99, thoracic: -101 }, neck: -93, head: -91, legs };
  const probe = solve({ ...base, arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } } });
  const S = probe.S;
  const start = add(S, [44, 22]), end = add(S, [121, 22]);
  const P: Vec2 = [(start[0] + end[0]) / 2, S[1] - 186];
  const R = len(sub(start, P));
  const th0 = ang(sub(start, P)), th1 = ang(sub(end, P));
  const rest = backrestAt(probe, 0.55);
  const colX = rest.c[0] - 40;
  const stack = weightStack({ x: colX - 46, top: P[1] - 6, lift: (t: number) => 30 * chestTL.at(t).p });
  return { hx, base, P, R, th0, th1, rest, colX, stack };
})();
const cpGrip = (p: number) => add(CP.P, mul(dir(lerp(CP.th0, CP.th1, p)), CP.R));
const chestPress = {
  id: 'chest-press', name: '坐姿推胸', tl: chestTL,
  muscles: [{ m: 'pecs' }, { m: 'triceps', side: 'both' }, { m: 'delts', side: 'near', scale: 0.55 }],
  props: (pal: Palette) => ({
    back: [
      ...CP.stack.fixed(pal),
      { kind: 'box', nm: 'base', color: pal.metalDark, c: [(CP.colX + CP.hx + 70) / 2, G - 5], s: [CP.hx + 70 - CP.colX + 20, 10], r: 3 },
      { kind: 'box', nm: 'column', color: pal.metal, c: [CP.colX, (CP.P[1] + G) / 2], s: [18, G - CP.P[1] + 14], r: 4 },
      { kind: 'box', nm: 'top-beam', color: pal.metal, c: [(CP.colX + CP.P[0]) / 2, CP.P[1]], s: [CP.P[0] - CP.colX + 18, 16], r: 8 },
      { kind: 'box', nm: 'backrest-arm', color: pal.metalDark, c: [(CP.colX + CP.rest.c[0]) / 2, CP.rest.c[1]], s: [CP.rest.c[0] - CP.colX, 10], r: 3 },
      { kind: 'box', nm: 'seat-post', color: pal.metalDark, c: [CP.hx + 6, G - 46], s: [14, 84], r: 3 },
      { kind: 'box', nm: 'seat-arm', color: pal.metalDark, c: [(CP.colX + CP.hx) / 2, G - 60], s: [CP.hx - CP.colX, 10], r: 3 },
      { kind: 'box', nm: 'backrest', color: pal.pad, c: CP.rest.c, s: CP.rest.size, r: 9, rot: CP.rest.rot },
      { kind: 'box', nm: 'seat', color: pal.pad, c: [CP.hx + 10, G - 104 + 25], s: [94, 16], r: 8 },
      { kind: 'oval', nm: 'pivot', color: pal.metalDark, c: CP.P, s: [24, 24] },
    ],
  }),
  dynamic: [
    CP.stack.dynamic,
    {
      nm: 'Press Arm', z: 'back', kind: 'rigid',
      shapes: (pal: Palette) => [
        { kind: 'box', nm: 'lever', color: pal.metal, c: [0, CP.R / 2], s: [12, CP.R], r: 6 },
        { kind: 'box', nm: 'grip', color: pal.padFar, c: [0, CP.R + 2], s: [10, 36], r: 5 },
        { kind: 'oval', nm: 'hub', color: pal.metal, c: [0, 0], s: [12, 12] },
      ],
      at: (J: Joints, t: number) => ({ p: CP.P, a: lerp(CP.th0, CP.th1, chestTL.at(t).p) - 90 }),
    },
  ],
  propsBox: [CP.stack.box[0], CP.hx + 140],
  pose(t) {
    const { p } = chestTL.at(t);
    const g = cpGrip(p);
    return {
      ...CP.base,
      arms: {
        near: { target: add(g, [-8, 0]), side: [-0.25, 1], hand: 0 },
        far: { target: add(g, [-11, -2]), side: [-0.25, 1], hand: 0 },
      },
    };
  },
} satisfies Exercise;

export default chestPress;
