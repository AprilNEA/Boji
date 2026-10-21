// Bent-over rope rear-delt row, front view. Face a low pulley with a soft-knee hip hinge and a neutral rope grip.
// Pull from extended arms to the upper chest with flared elbows and a brief shoulder-blade squeeze.
// The feet and spine remain fixed while the rope and cable travel with the hands.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/rig/front.ts';
import { cableColumn, cableHandle, cableLine, towardCable } from '@/exercises/equipment/index.ts';
import { hingePose, rearDeltMuscles, rearDeltTL, ropeGrip, rowArm } from './_rear-delt-1.ts';

const station = cableColumn({ x: 0, pulleyY: 348, toward: 1 });

export default {
  id: 'cable-rope-bent-over-rear-delt-row',
  name: '绳索俯身后三角肌划船',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Cable Rope Bent-Over Rear Delt Row', family: 'rear-delt', equipment: ['cable', 'rope'], sources: ['hz:0203'] },
  muscles: [...rearDeltMuscles, { m: 'biceps', side: 'both', scale: 0.35 }],
  props: (pal) => ({ back: station.draw(pal) }),
  propsBox: station.box,
  dynamic: [
    cableLine<FrontJoints>(station.pulley, ropeGrip),
    cableHandle<FrontJoints>('rope', (J) => { const p = ropeGrip(J); return { p, a: towardCable(p, station.pulley) }; }, { spread: 18 }),
  ],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return hingePose((side, J) => rowArm(p, side, J));
  },
} satisfies FrontExercise;
