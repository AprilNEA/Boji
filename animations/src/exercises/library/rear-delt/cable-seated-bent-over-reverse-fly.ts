// Seated bent-over cable reverse fly, front view. Sit at a flat-bench edge with the torso resting on the thighs.
// Opposite low-pulley handles start below the knees, then the upper arms open to shoulder height with soft elbows.
// The seat, feet and hip hinge stay fixed while both low cables cross under the knees.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/rig/front.ts';
import { cableColumn, cableHandle, cableLine, flatBench, frontGripAt, towardCable } from '@/exercises/equipment/index.ts';
import { flyArm, rearDeltMuscles, rearDeltTL, seatPose } from './_rear-delt-1.ts';

const bench = flatBench({ view: 'front', x: 0 });
const left = cableColumn({ x: -205, pulleyY: 370, toward: 1 });
const right = cableColumn({ x: 205, pulleyY: 370, toward: -1 });

export default {
  id: 'cable-seated-bent-over-reverse-fly',
  name: '绳索坐姿俯身反向飞鸟',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Cable Seated Bent-Over Reverse Fly', family: 'rear-delt', equipment: ['cable', 'bench'], sources: ['fe:Cable_Seated_Lateral_Raise'] },
  muscles: rearDeltMuscles,
  props: (pal) => ({ back: [...bench.draw(pal), ...left.draw(pal), ...right.draw(pal)] }),
  propsBox: [-228, 228],
  dynamic: [
    cableLine<FrontJoints>(right.pulley, (J) => frontGripAt(J, 'l'), 'Left crossed cable'),
    cableLine<FrontJoints>(left.pulley, (J) => frontGripAt(J, 'r'), 'Right crossed cable'),
    cableHandle<FrontJoints>('d', (J) => { const p = frontGripAt(J, 'l'); return { p, a: towardCable(p, right.pulley) }; }),
    cableHandle<FrontJoints>('d', (J) => { const p = frontGripAt(J, 'r'); return { p, a: towardCable(p, left.pulley) }; }),
  ],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    const pose = seatPose((side, J) => flyArm(p, side, J, true));
    return { ...pose, hips: { pitch: 57 }, spine: { pitch: 12 }, neck: { pitch: -8 }, head: { pitch: -8 } };
  },
} satisfies FrontExercise;
