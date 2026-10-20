// 臀桥 (glute-bridge). pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import { add, dir, lerp, mul, timeline, type Vec2 } from '@/math.ts';
import { A, FLOOR } from './common.ts';

const bridgeTL = timeline([
  { d: 1.2, from: 0, to: 1, e: [0.2, 1] },
  { d: 1.0, from: 1, to: 1, e: [1, 0.9] },
  { d: 1.5, from: 1, to: 0, e: [0.8, 0.35] },
  { d: 0.5, from: 0, to: 0, e: [0.35, 0.15] },
]);
const BRIDGE = (() => {
  const N: Vec2 = [150, FLOOR - 18];
  const R = 123.7; // almost the full spine length: shoulders, hips and knees line up at the top
  const phi0 = -3.8, phi1 = -42;
  const hip0 = add(N, mul(dir(phi0), R));
  const ankle: Vec2 = [hip0[0] + 106, FLOOR - A];
  return { N, R, phi0, phi1, ankle };
})();
const gluteBridge = {
  id: 'glute-bridge', name: '臀桥', tl: bridgeTL, mat: true,
  muscles: [{ m: 'glutes' }, { m: 'hamstrings', side: 'both' }],
  pose(t) {
    const { p } = bridgeTL.at(t);
    const hip = add(BRIDGE.N, mul(dir(lerp(BRIDGE.phi0, BRIDGE.phi1, p)), BRIDGE.R));
    return {
      hip,
      spine: { target: BRIDGE.N, side: [0, 1] },
      neck: 182, head: 181,
      legs: {
        near: { target: BRIDGE.ankle, foot: 0, side: [0, -1] },
        far: { target: add(BRIDGE.ankle, [-5, 0]), foot: 0, side: [0, -1] },
      },
      arms: {
        near: { a1: 8, a2: 1, hand: 0 },
        far: { a1: 7, a2: 0, hand: 0 },
      },
    };
  },
} satisfies Exercise;

export default gluteBridge;
