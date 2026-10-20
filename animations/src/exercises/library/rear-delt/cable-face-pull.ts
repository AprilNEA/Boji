// Cable face pull, front view. Stand facing a high pulley with a rope, arms extended at shoulder height.
// Pull the rope directly toward the face and separate the hands while the upper arms stay horizontal.
// The stance and torso remain still; the cable runs continuously from the high pulley to the rope.
import type { FrontExercise } from '@/exercise.ts';
import type { FrontJoints } from '@/front-rig.ts';
import { cableColumn, cableHandle, cableLine, towardCable } from '@/exercises/equipment/index.ts';
import { facePullArm, rearDeltMuscles, rearDeltTL, ropeGrip, standPose } from './_rear-delt-1.ts';

const station = cableColumn({ x: 0, pulleyY: 102, toward: 1 });

export default {
  id: 'cable-face-pull',
  name: '绳索面拉',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Cable Face Pull', family: 'rear-delt', equipment: ['cable', 'rope'], sources: ['fe:Face_Pull'] },
  muscles: rearDeltMuscles,
  props: (pal) => ({ back: station.draw(pal) }),
  propsBox: station.box,
  dynamic: [
    cableLine<FrontJoints>(station.pulley, ropeGrip),
    cableHandle<FrontJoints>('rope', (J) => { const p = ropeGrip(J); return { p, a: towardCable(p, station.pulley) }; }, { spread: 19 }),
  ],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return standPose((side, J) => facePullArm(p, side, J));
  },
} satisfies FrontExercise;
