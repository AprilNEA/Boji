// Lie on the back with one leg long and the opposite shoulder resting on the mat.
// Draw the bent knee across the body and support it below the knee while turning the head away.
import type { SideExercise } from '@/exercise.ts';
import { crossBodyKneePose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'supine-cross-body-knee-stretch', name: '仰卧跨体压膝拉伸', tl: stretchTL, mat: true,
  meta: { en: 'Supine Cross-Body Knee Stretch', family: 'stretch-spine', equipment: ['bodyweight', 'mat'], sources: ['fe:Knee_Across_The_Body'] },
  muscles: [{ m: 'glutes' }, { m: 'abductors', side: 'far', scale: 0.55 }, { m: 'lowerBack', scale: 0.4 }],
  poster: 0.44,
  pose: (t) => crossBodyKneePose(stretchTL.at(t).p),
} satisfies SideExercise;
