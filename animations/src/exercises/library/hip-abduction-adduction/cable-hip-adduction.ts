// Stand beside a low pulley with one hand steadying on the machine and the cuff on the outer ankle.
// From a wide, straight-leg start, sweep the cuffed leg inward across the standing leg.
// The support leg and trunk stay still while the cable remains connected to the ankle cuff.
import type { FrontExercise, MovingPart } from '@/exercise.ts';
import { lerp } from '@/math.ts';
import { project, type FrontJoints } from '@/front-rig.ts';
import { cableColumn, cableLine, workTL } from '@/exercises/equipment/index.ts';
import { standingPose } from './_hip-abduction-adduction.ts';

const tl = workTL(0.4);
const tower = cableColumn({ x: -160, pulleyY: 421, toward: 1 });
const cuff = {
  nm: 'Ankle Cuff', kind: 'rigid', z: 'front',
  shapes: (pal) => [
    { kind: 'ring', nm: 'cuff', color: pal.pad, c: [0, 0], s: [26, 20], w: 6 },
    { kind: 'box', nm: 'cuff-link', color: pal.metal, c: [-14, 0], s: [9, 7], r: 3 },
  ],
  at: (J: FrontJoints) => ({ p: project(J.ankle_r) }),
} satisfies MovingPart<FrontJoints>;

export default {
  id: 'cable-hip-adduction',
  name: '绳索髋内收',
  view: 'front',
  tl,
  meta: {
    en: 'Cable Hip Adduction', family: 'hip-abduction-adduction', equipment: ['cable'],
    sources: ['hz:0168', 'fe:Cable_Hip_Adduction'],
  },
  muscles: [{ m: 'adductors', side: 'r' }, { m: 'quads', side: 'both', scale: 0.3 }],
  props: (pal) => ({ back: [
    ...tower.draw(pal),
    { kind: 'box', nm: 'support-handle', color: pal.padFar, c: [-123, 226], s: [72, 9], r: 4 },
  ] }),
  propsBox: [tower.box[0], 148],
  dynamic: [cableLine(tower.pulley, (J) => project(J.ankle_r), 'Ankle Cable'), cuff],
  pose(t) {
    const p = tl.at(t).p;
    const pose = standingPose({
      l: { target: [27, 13, 4] },
      // At the end the cuffed leg crosses the supporting leg while retaining a 175° knee angle.
      r: { target: [lerp(-103, 46, p), lerp(34, 24, p), 4] },
    });
    pose.arms = { l: { target: [48, 213, 20] }, r: { target: [-97, 226, 10] } };
    return pose;
  },
} satisfies FrontExercise;
