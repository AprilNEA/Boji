// Sit tall on a bench with the feet flat and a loop band above the knees.
// The knees press outward against the band, pause, then return without moving the torso.
// The hands remain on the seat for stable support.
import type { FrontExercise } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { project } from '@/front-rig.ts';
import { bandCurve, miniBandPoints, workTL } from '@/exercises/equipment/index.ts';
import { seatedPose } from './_hip-abduction-adduction.ts';

const tl = workTL(0.35);

export default {
  id: 'band-seated-hip-abduction',
  name: '弹力带坐姿髋外展',
  view: 'front',
  tl,
  meta: { en: 'Band Seated Hip Abduction', family: 'hip-abduction-adduction', equipment: ['band', 'bench'], sources: ['hz:3006'] },
  muscles: [{ m: 'abductors', side: 'both' }, { m: 'glutes', scale: 0.5, region: { view: 'front', part: 'pelvis', c: [0, 12], s: [34, 18] } }],
  props: (pal) => ({ back: [
    { kind: 'box', nm: 'bench-seat', color: pal.pad, c: [0, 345], s: [206, 18], r: 7 },
    { kind: 'box', nm: 'bench-leg-left', color: pal.metalDark, c: [-76, 393], s: [14, 92], r: 5 },
    { kind: 'box', nm: 'bench-leg-right', color: pal.metalDark, c: [76, 393], s: [14, 92], r: 5 },
  ] }),
  dynamic: [bandCurve((J) => miniBandPoints(project(J.knee_r), project(J.knee_l), 5), 'front', 'Thigh Band')],
  pose(t) {
    const p = tl.at(t).p;
    const x = lerp(25, 68, p);
    return seatedPose({
      l: { target: [x, 13, 94] },
      r: { target: [-x, 13, 94] },
    });
  },
} satisfies FrontExercise;
