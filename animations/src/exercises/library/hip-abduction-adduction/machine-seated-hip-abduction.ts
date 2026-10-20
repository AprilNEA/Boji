// Sit upright against the machine backrest with feet on the footrests and hands on the side handles.
// Starting with the knee pads outside the thighs, press both knees apart and pause under control.
// The torso, seat contact and feet stay still while the linked pads follow the knees.
import type { FrontExercise, MovingPart } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { project, type FrontJoints } from '@/front-rig.ts';
import { workTL } from '@/exercises/equipment/index.ts';
import { seatedPose } from './_hip-abduction-adduction.ts';

const tl = workTL(0.45);
const pad = (side: 'l' | 'r'): MovingPart<FrontJoints> => ({
  nm: `${side} Outer Knee Pad`, kind: 'rigid', z: 'front',
  shapes: (pal) => [{ kind: 'box', nm: 'pad', color: pal.pad, c: [0, 0], s: [24, 46], r: 11 }],
  at: (J) => {
    const p = project(J[`knee_${side}`]);
    return { p: [p[0] + (side === 'l' ? 22 : -22), p[1]] };
  },
});
const lever = (side: 'l' | 'r'): MovingPart<FrontJoints> => ({
  nm: `${side} Abductor Lever`, kind: 'line', z: 'back', width: 10,
  color: (pal) => pal.metal,
  at: (J) => {
    const p = project(J[`knee_${side}`]);
    const end: [number, number] = [p[0] + (side === 'l' ? 22 : -22), p[1]];
    return [[side === 'l' ? 104 : -104, 357], end];
  },
});

export default {
  id: 'machine-seated-hip-abduction',
  name: '坐姿髋外展',
  view: 'front',
  tl,
  meta: {
    en: 'Machine Seated Hip Abduction', family: 'hip-abduction-adduction', equipment: ['machine'],
    sources: ['fe:Thigh_Abductor', 'hz:0597'],
  },
  muscles: [{ m: 'abductors', side: 'both' }, { m: 'glutes', scale: 0.5, region: { view: 'front', part: 'pelvis', c: [0, 12], s: [34, 18] } }],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'left-frame', color: pal.metal, c: [-121, 300], s: [14, 280], r: 6 },
    { kind: 'box', nm: 'right-frame', color: pal.metal, c: [121, 300], s: [14, 280], r: 6 },
    { kind: 'box', nm: 'top-frame', color: pal.metalDark, c: [0, 162], s: [258, 16], r: 5 },
    { kind: 'box', nm: 'backrest', color: pal.padFar, c: [0, 275], s: [92, 146], r: 12 },
    { kind: 'box', nm: 'seat', color: pal.pad, c: [0, 345], s: [142, 19], r: 8 },
    { kind: 'box', nm: 'left-handle', color: pal.padFar, c: [76, 330], s: [12, 44], r: 6 },
    { kind: 'box', nm: 'right-handle', color: pal.padFar, c: [-76, 330], s: [12, 44], r: 6 },
    { kind: 'box', nm: 'left-footrest', color: pal.metalDark, c: [55, 438], s: [58, 12], r: 4 },
    { kind: 'box', nm: 'right-footrest', color: pal.metalDark, c: [-55, 438], s: [58, 12], r: 4 },
  ] }),
  propsBox: [-130, 130],
  dynamic: [lever('l'), lever('r'), pad('l'), pad('r')],
  pose(t) {
    const x = lerp(25, 68, tl.at(t).p);
    return seatedPose({ l: { target: [x, 13, 94] }, r: { target: [-x, 13, 94] } });
  },
} satisfies FrontExercise;
