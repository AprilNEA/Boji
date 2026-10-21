// 坐姿划船 (seated-row). pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import type { Palette } from '@/draw/palettes.ts';
import { add, dir, lerp, lerpV, mul, type Vec2 } from '@/math/vec2.ts';
import { bump, smooth } from '@/math/timeline.ts';
import { solve, type LimbPair, type Joints } from '@/rig/side.ts';
import { G } from '@/exercises/common.ts';
import { weightStack, workTL } from '@/exercises/equipment/index.ts';

const rowTL = workTL(0.45);
const ROW = (() => {
  const hx = 150, hip: Vec2 = [hx, G - 88];
  const ankle = add(hip, mul(dir(-3), 170));
  const legs: LimbPair = {
    near: { target: ankle, foot: -80, side: [0, -1] },
    far: { target: add(ankle, [-4, 1]), foot: -80, side: [0, -1] },
  };
  const torso = (p: number) => ({ spine: { lumbar: lerp(-78, -94, p), thoracic: lerp(-80, -96, p) }, neck: lerp(-80, -90, p), head: lerp(-86, -90, p), shoulderShift: lerp(-2, 4, p) });
  const arm0 = { near: { a1: 0, a2: 0 }, far: { a1: 0, a2: 0 } };
  const J0 = solve({ hip, legs, ...torso(0), arms: arm0 });
  const J1 = solve({ hip, legs, ...torso(1), arms: arm0 });
  const start = add(J0.S, mul(dir(18), 121));
  const end = add(add(J1.B(0.42), mul(J1.A(0.42), 34)), [0, 0]);
  const plateX = ankle[0] + 18;
  const pulley: Vec2 = [plateX + 26, G - 92];
  const stack = weightStack({ x: plateX + 74, top: 70, lift: (t: number) => 34 * rowTL.at(t).p });
  return { hx, hip, legs, torso, start, end, plateX, pulley, stack, ankle };
})();
const rowGrip = (p: number) => {
  const q = smooth(p);
  const g = lerpV(ROW.start, ROW.end, q);
  return add(g, [0, -10 * bump(q)]); // slight arc toward the ribs
};
const seatedRow = {
  id: 'seated-row', name: '坐姿划船', tl: rowTL,
  muscles: [{ m: 'lats' }, { m: 'upperBack' }, { m: 'biceps', side: 'both', scale: 0.6 }],
  props: (pal: Palette) => ({
    back: [
      ...ROW.stack.fixed(pal),
      { kind: 'box', nm: 'rail', color: pal.metalDark, c: [(ROW.hx - 70 + ROW.stack.box[1]) / 2, G - 5], s: [ROW.stack.box[1] - ROW.hx + 70, 10], r: 3 },
      { kind: 'box', nm: 'bench-leg-back', color: pal.metalDark, c: [ROW.hx - 40, G - 38], s: [12, 66], r: 3 },
      { kind: 'box', nm: 'bench-leg-front', color: pal.metalDark, c: [ROW.hx + 40, G - 38], s: [12, 66], r: 3 },
      { kind: 'box', nm: 'bench', color: pal.pad, c: [ROW.hx + 2, G - 88 + 24], s: [150, 16], r: 8 },
      { kind: 'box', nm: 'footplate-post', color: pal.metalDark, c: [ROW.plateX + 8, G - 50], s: [12, 96], r: 3 },
      { kind: 'box', nm: 'footplate', color: pal.propDark, c: [ROW.plateX, ROW.ankle[1] - 8], s: [12, 64], r: 5, rot: 10 },
      { kind: 'box', nm: 'pulley-housing', color: pal.metal, c: [ROW.pulley[0], (ROW.pulley[1] + G) / 2], s: [16, G - ROW.pulley[1]], r: 4 },
      { kind: 'oval', nm: 'pulley', color: pal.metalDark, c: ROW.pulley, s: [18, 18] },
    ],
  }),
  dynamic: [
    ROW.stack.dynamic,
    { nm: 'Cable', z: 'back', kind: 'line', width: 2.6, color: (pal: Palette) => pal.cable, at: (J: Joints) => [ROW.pulley, add(J.wrist_n, mul(dir(J.hand_n.a), 9))] },
    {
      nm: 'V Handle', z: 'back', kind: 'rigid',
      shapes: (pal: Palette) => [{ kind: 'box', nm: 'handle', color: pal.metalDark, c: [0, 0], s: [8, 26], r: 4 }],
      at: (J: Joints) => ({ p: add(J.wrist_n, mul(dir(J.hand_n.a), 9)), a: 0 }),
    },
  ],
  propsBox: [ROW.hx - 80, ROW.stack.box[1]],
  pose(t) {
    const { p } = rowTL.at(t);
    const g = rowGrip(p);
    return {
      hip: ROW.hip, legs: ROW.legs, ...ROW.torso(p),
      arms: {
        near: { target: add(g, [-8, 0]), side: [-0.4, 1], hand: lerp(16, 4, p) },
        far: { target: add(g, [-11, -2]), side: [-0.4, 1], hand: lerp(16, 4, p) },
      },
    };
  },
} satisfies Exercise;

export default seatedRow;
