// 髋屈肌拉伸 (hip-flexor-stretch). pose(t) returns a rig pose for t in [0, 1).
import type { Exercise } from '../exercise.ts';
import { add, ang, dir, lerp, mul, sub, timeline, type Vec2 } from '../math.ts';
import { BODY, type Joints } from '../rig.ts';
import { A, FLOOR } from './common.ts';

const hipTL = timeline([
  { d: 2.2, from: 0, to: 1, ease: 'sine', e: [0.1, 1] },
  { d: 1.2, from: 1, to: 1, e: [1, 1] },
  { d: 1.8, from: 1, to: 0, ease: 'sine', e: [1, 0.1] },
  { d: 0.6, from: 0, to: 0, e: [0.1, 0.1] },
]);
// Kb: back knee on the mat. front: front ankle.
const backKnee: Vec2 = [185, FLOOR - 11];
const HIPS: { Kb: Vec2; front: Vec2 } = { Kb: backKnee, front: [backKnee[0] + 108, FLOOR - A] };
const hipFlexorStretch = {
  id: 'hip-flexor-stretch', name: '髋屈肌拉伸', tl: hipTL, mat: true,
  muscles: [{ m: 'hipFlexor', side: 'far' }, { m: 'quads', side: 'far', scale: 0.6 }],
  pose(t) {
    const { p } = hipTL.at(t);
    const hip = add(HIPS.Kb, mul(dir(lerp(-82, -63, p)), BODY.thigh));
    return {
      hip, farHip: 0,
      spine: { lumbar: lerp(-90, -95, p), thoracic: lerp(-91, -93, p) },
      neck: lerp(-86, -88, p), head: -89,
      legs: {
        near: { target: HIPS.front, foot: 0, side: [1, 0] },
        far: { a1: ang(sub(HIPS.Kb, hip)), a2: 178, foot: 180 },
      },
      arms: {
        near: { target: (J: Joints) => add(J.knee_n, [-17, -17]), side: [-1, 0.4], hand: 35 },
        far: { target: (J: Joints) => add(J.knee_n, [-24, -15]), side: [-1, 0.4], hand: 35 },
      },
    };
  },
} satisfies Exercise;

export default hipFlexorStretch;
