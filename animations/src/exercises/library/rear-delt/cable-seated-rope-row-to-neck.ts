// Seated low-pulley rope row to neck, front view. Sit upright with the rope at shoulder height and arms extended.
// Lift the elbows wide and pull until the hands approach the ears, then lower while the torso stays motionless.
// The feet remain planted and the cable remains taut from the low pulley to the rope.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/rig/front.ts';
import { cableColumn, cableHandle, cableLine, flatBench, towardCable } from '@/exercises/equipment/index.ts';
import { facePullArm, rearDeltMuscles, rearDeltTL, ropeGrip, seatPose } from './_rear-delt-1.ts';

const bench = flatBench({ view: 'front', x: 0 });
const station = cableColumn({ x: 0, pulleyY: 314, toward: 1 });

export default {
  id: 'cable-seated-rope-row-to-neck',
  name: '绳索坐姿绳把颈部划船',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Cable Seated Rope Row to Neck', family: 'rear-delt', equipment: ['cable', 'rope', 'bench'], sources: ['fe:Low_Pulley_Row_To_Neck'] },
  muscles: [...rearDeltMuscles, { m: 'biceps', side: 'both', scale: 0.35 }],
  props: (pal) => ({ back: [...bench.draw(pal), ...station.draw(pal)] }),
  propsBox: bench.box,
  dynamic: [
    cableLine<FrontJoints>(station.pulley, ropeGrip),
    cableHandle<FrontJoints>('rope', (J) => { const p = ropeGrip(J); return { p, a: towardCable(p, station.pulley) }; }, { spread: 19 }),
  ],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return seatPose((side, J) => facePullArm(p, side, J));
  },
} satisfies FrontExercise;
