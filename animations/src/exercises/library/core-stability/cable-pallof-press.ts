// Stand sideways to the shoulder-height pulley with soft knees and a braced, square torso.
// Press the handle straight forward and return while the cable pulls across the body.
import type { SideExercise } from '@/exercise.ts';
import { cableColumn, cableHandle, cableLine, gripAt, towardCable, workTL } from '@/exercises/equipment/index.ts';
import { pallofPose } from './_core-stability-1.ts';

const tl = workTL(0.8);
const tower = cableColumn({ x: 76, pulleyY: 166, toward: 1 });

export default {
  id: 'cable-pallof-press',
  name: '绳索抗旋转推',
  tl,
  meta: { en: 'Cable Pallof Press', family: 'core-stability', equipment: ['cable'], sources: ['fe:Pallof_Press'] },
  muscles: [{ m: 'abs' }, { m: 'obliques', scale: 0.65 }, { m: 'delts', side: 'both', scale: 0.35 }, { m: 'triceps', side: 'both', scale: 0.3 }],
  props: (pal) => ({ back: tower.draw(pal) }),
  propsBox: [tower.box[0], 402],
  dynamic: [
    cableLine(tower.pulley, (J) => gripAt(J, 'n')),
    cableHandle('d', (J) => {
      const grip = gripAt(J, 'n');
      return { p: grip, a: towardCable(grip, tower.pulley) };
    }),
  ],
  poster: 0.28,
  pose: (t) => pallofPose(tl.at(t).p),
} satisfies SideExercise;
