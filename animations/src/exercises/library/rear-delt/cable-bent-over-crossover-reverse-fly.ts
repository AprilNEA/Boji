// Crossed-cable bent-over reverse fly, front view. Stand between low pulleys with soft knees and a fixed hip hinge.
// The crossed handles begin low in front, then the arms open out and back with softly unlocked elbows.
// Both feet and the trunk remain stable while each cable stays connected to its opposite hand.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/rig/front.ts';
import { cableColumn, cableHandle, cableLine, frontGripAt, towardCable } from '@/exercises/equipment/index.ts';
import { flyArm, hingePose, rearDeltMuscles, rearDeltTL } from './_rear-delt-1.ts';

const left = cableColumn({ x: -205, pulleyY: 356, toward: 1 });
const right = cableColumn({ x: 205, pulleyY: 356, toward: -1 });

export default {
  id: 'cable-bent-over-crossover-reverse-fly',
  name: '绳索俯身交叉反向飞鸟',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Cable Bent-Over Crossover Reverse Fly', family: 'rear-delt', equipment: ['cable'], sources: ['hz:0154'] },
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
    return hingePose((side, J) => flyArm(p, side, J, true));
  },
} satisfies FrontExercise;
