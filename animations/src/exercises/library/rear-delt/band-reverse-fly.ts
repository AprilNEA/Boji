// Anchored band reverse fly, front view. The band wraps a chest-height post and the arms begin extended forward.
// Both straight arms open outward and slightly back to shoulder height, then close under tension.
// The feet stay shoulder-width and the torso remains vertical while the shoulder blades retract.
import type { FrontExercise } from '@/exercise.ts';
import { bandLine, frontGripAt } from '@/exercises/equipment/index.ts';
import { flyArm, rearDeltMuscles, rearDeltTL, standPose } from './_rear-delt-1.ts';

const ANCHOR: [number, number] = [0, 250];

export default {
  id: 'band-reverse-fly',
  name: '弹力带反向飞鸟',
  view: 'front',
  tl: rearDeltTL,
  meta: { en: 'Band Reverse Fly', family: 'rear-delt', equipment: ['band'], sources: ['fe:Back_Flyes_-_With_Bands', 'hz:0993'] },
  muscles: rearDeltMuscles,
  props: (pal) => ({
    back: [
      { kind: 'box', nm: 'anchor-post', color: pal.prop, c: [0, 244], s: [18, 392], r: 4 },
      { kind: 'oval', nm: 'anchor-ring', color: pal.metal, c: ANCHOR, s: [19, 19] },
    ],
  }),
  propsBox: [-12, 12],
  dynamic: [
    bandLine((J) => [ANCHOR, frontGripAt(J, 'l')], 'underNearArm', 'Left band'),
    bandLine((J) => [ANCHOR, frontGripAt(J, 'r')], 'underNearArm', 'Right band'),
  ],
  pose(t) {
    const { p } = rearDeltTL.at(t);
    return standPose((side, J) => flyArm(p, side, J));
  },
} satisfies FrontExercise;
