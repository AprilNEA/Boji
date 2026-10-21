// High-cable reverse fly, front view. Begin tall between overhead pulleys with the crossed handles in front.
// Keep the elbows nearly straight while the arms open outward and slightly back to shoulder height.
// The feet and trunk stay fixed, and each overhead cable remains attached to the opposite hand.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/rig/front.ts';
import { cableColumn, cableHandle, cableLine, frontGripAt, towardCable } from '@/exercises/equipment/index.ts';
import { flyArm, rearDeltMuscles, rearDeltTL, standPose } from './_rear-delt-1.ts';

const left = cableColumn({ x: -205, pulleyY: 58, toward: 1 });
const right = cableColumn({ x: 205, pulleyY: 58, toward: -1 });

export default {
  id: 'cable-high-reverse-fly',
  name: '高位绳索反向飞鸟',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Cable High Reverse Fly', family: 'rear-delt', equipment: ['cable'], sources: ['fe:Cable_Rear_Delt_Fly'] },
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
