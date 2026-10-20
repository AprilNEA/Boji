// Band bent-over rear-delt row, front view. Stand on the band with soft knees and a flat hip hinge.
// The handles start ahead of the shoulders, then travel to the upper chest while the elbows flare wide.
// Both feet stay planted on the band and the upper back remains braced throughout the repetition.
import type { FrontExercise } from '@/exercise.ts';
import { frontGripAt, bandCurve } from '@/exercises/equipment/index.ts';
import { hingePose, rearDeltMuscles, rearDeltTL, rowArm } from './_rear-delt-1.ts';

export default {
  id: 'band-bent-over-rear-delt-row',
  name: '弹力带俯身后三角划船',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Band Bent-Over Rear Delt Row', family: 'rear-delt', equipment: ['band'], sources: ['hz:1022'] },
  muscles: rearDeltMuscles,
  dynamic: [bandCurve((J) => {
    const l = frontGripAt(J, 'l'), r = frontGripAt(J, 'r');
    return [l, [J.ankle_l[0], 443], [0, 449], [J.ankle_r[0], 443], r];
  })],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return hingePose((side, J) => rowArm(p, side, J));
  },
} satisfies FrontExercise;
