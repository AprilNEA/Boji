// Band pull-apart, front view. Start tall with the band at shoulder height and elbows nearly straight.
// The hands travel laterally until the band reaches the chest line, then return under control.
// The feet, trunk and shoulder height remain fixed; the shoulders stay back without a shrug.
import type { FrontExercise } from '@/exercise.ts';
import { bandLine, frontGripAt } from '@/exercises/equipment/index.ts';
import { flyArm, rearDeltMuscles, rearDeltTL, standPose } from './_rear-delt-1.ts';

export default {
  id: 'band-pull-apart',
  name: '弹力带拉开',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Band Pull-Apart', family: 'rear-delt', equipment: ['band'], sources: ['fe:Band_Pull_Apart'] },
  muscles: rearDeltMuscles,
  dynamic: [bandLine((J) => [frontGripAt(J, 'l'), frontGripAt(J, 'r')])],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return standPose((side, J) => flyArm(p, side, J));
  },
} satisfies FrontExercise;
