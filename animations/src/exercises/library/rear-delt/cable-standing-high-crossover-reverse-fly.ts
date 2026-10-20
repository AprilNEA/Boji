// Standing high crossover reverse fly, front view. Stand between shoulder-height cable columns with crossed handles.
// Start with soft elbows in front of the chest, then open the arms outward to shoulder height while retracting the shoulder blades.
// The feet and upright trunk stay still; both cables stay crossed from the columns to the opposite hands.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/front-rig.ts';
import { cableColumn, cableHandle, cableLine, frontGripAt, towardCable } from '@/exercises/equipment/index.ts';
import { flyArm, rearDeltMuscles, rearDeltTL, standPose } from './_rear-delt-1.ts';

const left = cableColumn({ x: -205, pulleyY: 246, toward: 1 });
const right = cableColumn({ x: 205, pulleyY: 246, toward: -1 });

export default {
  id: 'cable-standing-high-crossover-reverse-fly',
  name: '绳索站姿高位交叉反向飞鸟',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Cable Standing High Crossover Reverse Fly', family: 'rear-delt', equipment: ['cable'], sources: ['hz:0225'] },
  muscles: rearDeltMuscles,
  props: (pal) => ({ back: [...left.draw(pal), ...right.draw(pal)] }),
  propsBox: [-228, 228],
  dynamic: [
    cableLine<FrontJoints>(right.pulley, (J) => frontGripAt(J, 'l'), 'Left crossed cable'),
    cableLine<FrontJoints>(left.pulley, (J) => frontGripAt(J, 'r'), 'Right crossed cable'),
    cableHandle<FrontJoints>('d', (J) => { const p = frontGripAt(J, 'l'); return { p, a: towardCable(p, right.pulley) }; }),
    cableHandle<FrontJoints>('d', (J) => { const p = frontGripAt(J, 'r'); return { p, a: towardCable(p, left.pulley) }; }),
  ],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return standPose((side, J) => flyArm(p, side, J));
  },
} satisfies FrontExercise;
