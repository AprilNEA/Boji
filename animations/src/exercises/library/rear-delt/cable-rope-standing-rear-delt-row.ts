// Standing rope rear-delt row, front view. Face a chest-height pulley with a neutral-grip rope and a braced trunk.
// Pull the rope from straight arms to the upper chest as the elbows flare out at shoulder height.
// The feet stay shoulder-width and the cable stays taut from the pulley to the rope attachment.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/rig/front.ts';
import { cableColumn, cableHandle, cableLine, towardCable } from '@/exercises/equipment/index.ts';
import { rearDeltMuscles, rearDeltTL, ropeGrip, rowArm, standPose } from './_rear-delt-1.ts';

const station = cableColumn({ x: 0, pulleyY: 238, toward: 1 });

export default {
  id: 'cable-rope-standing-rear-delt-row',
  name: '绳索绳把站姿后三角划船',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Cable Rope Standing Rear Delt Row', family: 'rear-delt', equipment: ['cable', 'rope'], sources: ['hz:0233'] },
  muscles: [...rearDeltMuscles, { m: 'biceps', side: 'both', scale: 0.35 }],
  props: (pal) => ({ back: station.draw(pal) }),
  propsBox: station.box,
  dynamic: [
    cableLine<FrontJoints>(station.pulley, ropeGrip),
    cableHandle<FrontJoints>('rope', (J) => { const p = ropeGrip(J); return { p, a: towardCable(p, station.pulley) }; }, { spread: 18 }),
  ],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return standPose((side, J) => rowArm(p, side, J));
  },
} satisfies FrontExercise;
