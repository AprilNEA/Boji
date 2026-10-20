// 靠墙静蹲 (wall-sit). The back slides down the wall, holds with thighs level, then slides up. pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '@/exercise.ts';
import type { Palette } from '@/palettes.ts';
import { add, breath, dir, lerp, lerpV, mul, timeline, type Segment, type Vec2 } from '@/math.ts';
import { BODY, type Joints } from '@/rig.ts';
import { A, G } from './common.ts';

const HOLD: Segment = { d: 3.0, from: 1, to: 1, ease: 'linear', e: [0.6, 1] };
const sitTL = timeline([
  { d: 1.4, from: 0, to: 1, e: [0.2, 0.6] },
  HOLD,
  { d: 1.2, from: 1, to: 0, e: [0.9, 0.3] },
  { d: 0.6, from: 0, to: 0, e: [0.3, 0.2] },
]);

const WALL_X = 150; // right face of the wall
const HIP_X = WALL_X + 18; // the back of the pelvis touches the wall
const ANKLE: Vec2 = [HIP_X + 96, G - A];
const HIP_TOP = G - A - 150;
const HIP_BOTTOM = G - A - 92;

/** Arm hanging at the side, from the shoulder. */
const hangWrist = (S: Vec2): Vec2 => add(S, add(mul(dir(92), BODY.upper), mul(dir(86), BODY.fore)));
/** Palm resting on top of the thigh, toward the knee. */
const thighPoint = (J: Joints, dx: number): Vec2 =>
  add(add(lerpV(J.H, J.knee_n, 0.62), mul(dir(J.thigh_n.a - 90), 14)), [dx, 0]);

const wallSit = {
  id: 'wall-sit', name: '靠墙静蹲', tl: sitTL,
  muscles: [{ m: 'quads', side: 'both' }, { m: 'glutes', scale: 0.6 }],
  props: (pal: Palette) => ({
    back: [
      { kind: 'box', nm: 'wall', color: pal.prop, c: [WALL_X - 30, (G + 30) / 2], s: [60, G - 30], r: 6 },
      { kind: 'box', nm: 'baseboard', color: pal.propDark, c: [WALL_X - 30, G - 8], s: [60, 16], r: 2 },
    ],
  }),
  propsBox: [WALL_X - 60, WALL_X],
  pose(t) {
    const ph = sitTL.at(t);
    const p = ph.p;
    // A slow breath during the hold.
    const breathing = ph.seg === HOLD ? breath(ph.u) : 0;
    const arm = (sfx: 'n' | 'f', dx: number) => ({
      target: (J: Joints) => lerpV(hangWrist(sfx === 'n' ? J.S : J.Sf), thighPoint(J, dx), p),
      hand: (J: Joints) => lerp(86, J.thigh_n.a, p),
    });
    return {
      hip: [HIP_X, lerp(HIP_TOP, HIP_BOTTOM, p)],
      spine: { lumbar: -90, thoracic: -90.5 + 0.8 * breathing },
      neck: -88, head: -89,
      legs: {
        near: { target: ANKLE, foot: 0, side: [1, 0] },
        far: { target: add(ANKLE, [-5, 0]), foot: 0, side: [1, 0] },
      },
      arms: { near: arm('n', 0), far: arm('f', -5) },
    };
  },
} satisfies Exercise;

export default wallSit;
