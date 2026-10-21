// Sit tall on a bench with the knees bent and a loop band around the ankles.
// Keep the knees nearly still, rotate both hips internally, and move the feet outward.
// The torso and hands stay fixed while the ankles return slowly to the start.
import type { FrontExercise } from '@/exercise.ts';
import { lerp } from '@/math/vec2.ts';
import { project } from '@/rig/front.ts';
import { bandCurve, miniBandPoints, workTL } from '@/exercises/equipment/index.ts';

const tl = workTL(0.35);

export default {
  id: 'band-seated-hip-internal-rotation',
  name: '弹力带坐姿髋内旋',
  view: 'front',
  tl,
  meta: {
    en: 'Band Seated Hip Internal Rotation',
    family: 'misc',
    equipment: ['band', 'bench'],
    sources: ['hz:0996'],
  },
  muscles: [
    { m: 'abductors', side: 'both' },
    { m: 'glutes', scale: 0.5, region: { view: 'front', part: 'pelvis', c: [0, 12], s: [34, 18] } },
  ],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'bench-seat', color: pal.pad, c: [0, 345], s: [206, 18], r: 7 },
    { kind: 'box', nm: 'bench-leg-left', color: pal.metalDark, c: [-76, 393], s: [14, 92], r: 5 },
    { kind: 'box', nm: 'bench-leg-right', color: pal.metalDark, c: [76, 393], s: [14, 92], r: 5 },
  ] }),
  dynamic: [bandCurve((J) => miniBandPoints(project(J.ankle_r), project(J.ankle_l), 5), 'front', 'Ankle Band')],
  pose(t) {
    const p = tl.at(t).p;
    // In seated hip internal rotation the knees stay aligned while both feet travel outward.
    const footX = lerp(46, 62, p);
    return {
      pelvis: [0, 115, 0],
      legs: {
        l: { target: [footX, 13, 94], pole: [0, 0, 1] },
        r: { target: [-footX, 13, 94], pole: [0, 0, 1] },
      },
      arms: {
        l: { target: [76, 122, 18] },
        r: { target: [-76, 122, 18] },
      },
    };
  },
} satisfies FrontExercise;
