// Sit on the mat with the legs extended and palms on the floor behind the hips.
// Press through the supporting hands to lean back with a straight, gently extended spine.
import type { SideExercise } from '@/exercise.ts';
import { seatedLeanBackPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'seated-spine-stretch', name: '坐姿脊柱伸展', tl: stretchTL, mat: true,
  meta: { en: 'Seated Spine Stretch', family: 'stretch-spine', equipment: ['bodyweight', 'mat'], sources: ['hz:1363'] },
  muscles: [{ m: 'lowerBack' }, { m: 'abs', scale: 0.35 }, { m: 'hipFlexor', side: 'both', scale: 0.3 }],
  poster: 0.44, pose: (t) => seatedLeanBackPose(stretchTL.at(t).p),
} satisfies SideExercise;
