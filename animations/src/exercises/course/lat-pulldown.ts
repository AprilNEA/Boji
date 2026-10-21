// 高位下拉 (lat-pulldown). pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import type { Palette } from '@/draw/palettes.ts';
import { add, dir, lerp, lerpV, mul, type Vec2 } from '@/math/vec2.ts';
import { smooth } from '@/math/timeline.ts';
import { solve, type LimbPair, type Joints } from '@/rig/side.ts';
import { A, G } from '@/exercises/common.ts';
import { backrestAt, weightStack, workTL } from '@/exercises/equipment/index.ts';

const pullTL = workTL(0.45);
const LPD = (() => {
  const hx = 236, hip: Vec2 = [hx, G - 104];
  const legs: LimbPair = {
    near: { target: [hx + 100, G - A], foot: 0, side: [0, -1] },
    far: { target: [hx + 94, G - A], foot: 0, side: [0, -1] },
  };
  const torso = (p: number) => ({ spine: { lumbar: lerp(-97, -101, p), thoracic: lerp(-99, -106, p) }, neck: lerp(-94, -98, p), head: lerp(-92, -96, p), shoulderShift: lerp(-1, 3, p) });
  const arm0 = { near: { a1: 0, a2: 0 }, far: { a1: 0, a2: 0 } };
  const J0 = solve({ hip, legs, ...torso(0), arms: arm0 });
  const J1 = solve({ hip, legs, ...torso(1), arms: arm0 });
  const barX = J1.S[0] + 30;
  const top: Vec2 = [barX, J0.S[1] - 120];
  const bottom: Vec2 = [barX, J1.S[1] + 4];
  const pulley: Vec2 = [barX, 28];
  const rest = backrestAt(J0, 0.5);
  const colX = hx - 74;
  const stack = weightStack({ x: colX - 46, top: 40, lift: (t: number) => 38 * pullTL.at(t).p });
  return { hx, hip, legs, torso, top, bottom, pulley, colX, stack, J0 };
})();
const lpdBar = (J: Joints) => add(J.wrist_n, mul(dir(J.hand_n.a), 8));
const latPulldown = {
  id: 'lat-pulldown', name: '高位下拉', tl: pullTL,
  muscles: [{ m: 'lats' }, { m: 'biceps', side: 'both', scale: 0.6 }, { m: 'upperBack', scale: 0.6 }],
  props: (pal: Palette) => {
    const knee = LPD.J0.knee_n;
    return {
      back: [
        ...LPD.stack.fixed(pal),
        { kind: 'box', nm: 'base', color: pal.metalDark, c: [(LPD.stack.box[0] + LPD.hx + 80) / 2, G - 5], s: [LPD.hx + 80 - LPD.stack.box[0], 10], r: 3 },
        { kind: 'box', nm: 'column', color: pal.metal, c: [LPD.colX, (LPD.pulley[1] + G) / 2], s: [18, G - LPD.pulley[1] + 14], r: 4 },
        { kind: 'box', nm: 'top-beam', color: pal.metal, c: [(LPD.colX + LPD.pulley[0]) / 2, LPD.pulley[1] - 8], s: [LPD.pulley[0] - LPD.colX + 26, 16], r: 8 },
        { kind: 'box', nm: 'seat-arm', color: pal.metalDark, c: [(LPD.colX + LPD.hx) / 2, G - 64], s: [LPD.hx - LPD.colX, 10], r: 3 },
        { kind: 'box', nm: 'seat-post', color: pal.metalDark, c: [LPD.hx + 6, G - 46], s: [14, 84], r: 3 },
        { kind: 'box', nm: 'pad-post', color: pal.metalDark, c: [knee[0] - 16, (knee[1] + G) / 2 - 10], s: [10, G - knee[1] + 10], r: 3 },
        { kind: 'box', nm: 'seat', color: pal.pad, c: [LPD.hx + 10, G - 104 + 25], s: [94, 16], r: 8 },
        { kind: 'oval', nm: 'top-pulley', color: pal.metalDark, c: LPD.pulley, s: [20, 20] },
        { kind: 'oval', nm: 'top-pulley-hub', color: pal.metal, c: LPD.pulley, s: [7, 7] },
      ],
      front: [
        { kind: 'box', nm: 'thigh-pad', color: pal.pad, c: [knee[0] - 16, knee[1] - 21], s: [40, 18], r: 9 },
      ],
    };
  },
  dynamic: [
    LPD.stack.dynamic,
    { nm: 'Cable', z: 'back', kind: 'line', width: 2.6, color: (pal: Palette) => pal.cable, at: (J: Joints) => [LPD.pulley, lpdBar(J)] },
    {
      nm: 'Bar', z: 'back', kind: 'rigid',
      shapes: (pal: Palette) => [
        { kind: 'box', nm: 'bar', color: pal.metalDark, c: [0, 0], s: [44, 9], r: 4.5 },
        { kind: 'box', nm: 'grip-far', color: pal.padFar, c: [-10, 0], s: [14, 11], r: 5 },
      ],
      at: (J: Joints) => ({ p: lpdBar(J), a: 0 }),
    },
  ],
  propsBox: [LPD.stack.box[0], LPD.hx + 130],
  pose(t) {
    const { p } = pullTL.at(t);
    const q = smooth(p);
    const w = lerpV(LPD.top, LPD.bottom, q);
    return {
      hip: LPD.hip, legs: LPD.legs, ...LPD.torso(p),
      arms: {
        near: { target: add(w, [2, 8 - 14 * q]), side: [-1, 0.25] },
        far: { target: add(w, [-4, 6 - 14 * q]), side: [-1, 0.25] },
      },
    };
  },
} satisfies Exercise;

export default latPulldown;
