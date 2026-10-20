// Seated cable reverse fly, front view. Sit upright facing two pulleys with both feet flat and arms at shoulder height.
// Open the nearly straight arms laterally until they are parallel to the floor, then return under control.
// The torso stays upright on the bench and each cable remains connected to its handle.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/front-rig.ts';
import { cableColumn, cableHandle, cableLine, flatBench, frontGripAt, towardCable } from '@/exercises/equipment/index.ts';
import { flyArm, rearDeltMuscles, rearDeltTL, seatPose } from './_rear-delt-1.ts';

const bench = flatBench({ view: 'front', x: 0 });
const left = cableColumn({ x: -205, pulleyY: 246, toward: 1 });
const right = cableColumn({ x: 205, pulleyY: 246, toward: -1 });

export default {
  id: 'cable-seated-reverse-fly',
  name: '绳索坐姿反向飞鸟',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Cable Seated Reverse Fly', family: 'rear-delt', equipment: ['cable', 'bench'], sources: ['hz:0215'] },
  muscles: rearDeltMuscles,
  props: (pal) => ({ back: [...bench.draw(pal), ...left.draw(pal), ...right.draw(pal)] }),
  propsBox: [-228, 228],
  dynamic: [
    cableLine<FrontJoints>(left.pulley, (J) => frontGripAt(J, 'l'), 'Left cable'),
    cableLine<FrontJoints>(right.pulley, (J) => frontGripAt(J, 'r'), 'Right cable'),
    cableHandle<FrontJoints>('d', (J) => { const p = frontGripAt(J, 'l'); return { p, a: towardCable(p, left.pulley) }; }),
    cableHandle<FrontJoints>('d', (J) => { const p = frontGripAt(J, 'r'); return { p, a: towardCable(p, right.pulley) }; }),
  ],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return seatPose((side, J) => flyArm(p, side, J));
  },
} satisfies FrontExercise;
