// Stand with softly bent knees and both feet planted at hip width.
// One hand supports the hip while the opposite hand stays behind the head during a lateral bend.
import type { FrontExercise } from '@/exercise.ts';
import { frontStandingSideBendPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'standing-side-bend-stretch',
  name: '站姿体侧拉伸',
  view: 'front',
  tl: stretchTL,
  meta: { en: 'Standing Side Bend Stretch', family: 'stretch-spine', equipment: ['bodyweight'], sources: ['fe:Standing_Lateral_Stretch'] },
  muscles: [{ m: 'obliques' }, { m: 'abs', scale: 0.45 }],
  poster: 0.44,
  pose: (t) => frontStandingSideBendPose(stretchTL.at(t).p),
} satisfies FrontExercise;
