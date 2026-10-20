// Kneeling rope rear-delt row, front view. Kneel facing a low pulley with a neutral rope grip and a neutral spine.
// Pull the rope from full reach toward the upper body while the elbows flare outward and shoulder blades retract.
// The knees and feet remain grounded, and the low cable stays taut to the moving rope.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/front-rig.ts';
import { cableColumn, cableHandle, cableLine, towardCable } from '@/exercises/equipment/index.ts';
import { kneelPose, rearDeltMuscles, rearDeltTL, ropeGrip, rowArm } from './_rear-delt-1.ts';

const station = cableColumn({ x: 0, pulleyY: 351, toward: 1 });

export default {
  id: 'cable-kneeling-rope-rear-delt-row',
  name: '绳索跪姿绳把后三角划船',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Cable Kneeling Rope Rear Delt Row', family: 'rear-delt', equipment: ['cable', 'rope'], sources: ['hz:3697'] },
  muscles: [...rearDeltMuscles, { m: 'biceps', side: 'both', scale: 0.35 }],
  props: (pal) => ({ back: station.draw(pal) }),
  propsBox: station.box,
  dynamic: [
    cableLine<FrontJoints>(station.pulley, ropeGrip),
    cableHandle<FrontJoints>('rope', (J) => { const p = ropeGrip(J); return { p, a: towardCable(p, station.pulley) }; }, { spread: 18 }),
  ],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return kneelPose((side, J) => rowArm(p, side, J));
  },
} satisfies FrontExercise;
