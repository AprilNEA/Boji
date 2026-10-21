// 坐姿腿举 (leg-press). pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import type { Palette } from '@/draw/palettes.ts';
import { add, dir, len, lerp, lerpV, mul, sub, type Vec2 } from '@/math/vec2.ts';
import { timeline } from '@/math/timeline.ts';
import { solve, type Joints } from '@/rig/side.ts';
import { G } from '@/exercises/common.ts';
import { backrestAt, weightStack } from '@/exercises/equipment/index.ts';

const legTL = timeline([
  { d: 1.1, from: 0, to: 1, e: [0.4, 1] },
  { d: 0.3, from: 1, to: 1, e: [1, 0.85] },
  { d: 1.8, from: 1, to: 0, e: [0.8, 0.45] },
  { d: 0.4, from: 0, to: 0, e: [0.45, 0.4] },
]);
const LP = (() => {
  const hx = 150, hip: Vec2 = [hx, G - 128];
  const delta = -12;
  const base = { hip, spine: { lumbar: -116, thoracic: -118 }, neck: -108, head: -101 };
  const probe = solve({ ...base, legs: { near: { a1: 0, a2: 0 }, far: { a1: 0, a2: 0 } }, arms: { near: { a1: 90, a2: 90 }, far: { a1: 90, a2: 90 } } });
  const rest = backrestAt(probe, 0.5, 9, [18, 170], 18);
  const stack = weightStack({ x: rest.c[0] - 78, top: 110, lift: (t: number) => 34 * legTL.at(t).p });
  return { hx, hip, delta, base, rest, stack, d0: 122, d1: 176 };
})();
const lpAnkle = (p: number) => add(LP.hip, mul(dir(LP.delta), lerp(LP.d0, LP.d1, p)));
const legPress = {
  id: 'leg-press', name: '坐姿腿举', tl: legTL,
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes' }],
  props: (pal: Palette) => {
    const railStart = add(LP.hip, mul(dir(LP.delta), 60));
    const railEnd = add(LP.hip, mul(dir(LP.delta), LP.d1 + 52));
    const railC = lerpV(railStart, railEnd, 0.5);
    return {
      back: [
        ...LP.stack.fixed(pal),
        { kind: 'box', nm: 'base', color: pal.metalDark, c: [(LP.stack.box[0] + railEnd[0]) / 2, G - 5], s: [railEnd[0] - LP.stack.box[0], 10], r: 3 },
        { kind: 'box', nm: 'rail-post', color: pal.metalDark, c: [railEnd[0] - 10, (railEnd[1] + G) / 2 + 10], s: [14, G - railEnd[1] - 10], r: 3 },
        { kind: 'box', nm: 'seat-post', color: pal.metalDark, c: [LP.hx + 4, (LP.hip[1] + G) / 2 + 14], s: [16, G - LP.hip[1] - 20], r: 3 },
        { kind: 'box', nm: 'rail', color: pal.metal, c: add(railC, mul(dir(LP.delta + 90), 34)), s: [len(sub(railEnd, railStart)), 10], r: 5, rot: LP.delta },
        { kind: 'box', nm: 'backrest-arm', color: pal.metalDark, c: lerpV(LP.rest.c, [LP.hx + 4, LP.hip[1] + 30], 0.5), s: [10, 60], r: 3, rot: LP.rest.rot },
        { kind: 'box', nm: 'backrest', color: pal.pad, c: LP.rest.c, s: LP.rest.size, r: 9, rot: LP.rest.rot },
        { kind: 'box', nm: 'seat', color: pal.pad, c: [LP.hx + 14, LP.hip[1] + 25], s: [96, 16], r: 8, rot: -6 },
        { kind: 'box', nm: 'side-handle', color: pal.metalDark, c: [LP.hx + 18, LP.hip[1] + 6], s: [26, 9], r: 4.5 },
      ],
    };
  },
  dynamic: [
    LP.stack.dynamic,
    {
      nm: 'Footplate', z: 'back', kind: 'rigid',
      shapes: (pal: Palette) => [
        { kind: 'box', nm: 'carriage', color: pal.metalDark, c: [-16, 24], s: [40, 12], r: 4 },
        { kind: 'box', nm: 'plate', color: pal.propDark, c: [0, -6], s: [12, 104], r: 5 },
      ],
      at: (J: Joints, t: number) => ({ p: add(lpAnkle(legTL.at(t).p), mul(dir(LP.delta), 20)), a: LP.delta }),
    },
  ],
  propsBox: [LP.stack.box[0], LP.hip[0] + LP.d1 + 70],
  pose(t) {
    const { p } = legTL.at(t);
    const a = lpAnkle(p);
    const foot = LP.delta - 90 + 4;
    return {
      ...LP.base,
      legs: {
        near: { target: a, foot, side: [0, -1] },
        far: { target: add(a, [-4, -1]), foot, side: [0, -1] },
      },
      arms: {
        near: { target: [LP.hx + 12, LP.hip[1] + 4], side: [-1, 0.3], hand: 0 },
        far: { target: [LP.hx + 9, LP.hip[1] + 2], side: [-1, 0.3], hand: 0 },
      },
    };
  },
} satisfies Exercise;

export default legPress;
