// Seated rope rear-delt row, front view. Sit upright at a low-pulley station with the rope held overhand.
// Pull the rope toward the upper chest with upper arms horizontal and elbows traveling slightly behind the body.
// The bench, feet and lower back remain fixed while the low cable tracks the rope attachment.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/front-rig.ts';
import { cableColumn, cableHandle, cableLine, flatBench, towardCable } from '@/exercises/equipment/index.ts';
import { rearDeltMuscles, rearDeltTL, ropeGrip, rowArm, seatPose } from './_rear-delt-1.ts';

const bench = flatBench({ view: 'front', x: 0 });
const station = cableColumn({ x: 0, pulleyY: 292, toward: 1 });

export default {
  id: 'cable-seated-rope-rear-delt-row',
  name: '绳索坐姿绳把后束划船',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Cable Seated Rope Rear Delt Row', family: 'rear-delt', equipment: ['cable', 'rope', 'bench'], sources: ['fe:Cable_Rope_Rear-Delt_Rows'] },
  muscles: [...rearDeltMuscles, { m: 'biceps', side: 'both', scale: 0.35 }],
  props: (pal) => ({ back: [...bench.draw(pal), ...station.draw(pal)] }),
  propsBox: bench.box,
  dynamic: [
    cableLine<FrontJoints>(station.pulley, ropeGrip),
    cableHandle<FrontJoints>('rope', (J) => { const p = ropeGrip(J); return { p, a: towardCable(p, station.pulley) }; }, { spread: 18 }),
  ],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return seatPose((side, J) => rowArm(p, side, J));
  },
} satisfies FrontExercise;
