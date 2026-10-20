// Lie face down with the pelvis, legs, elbows, and forearms supported by the mat.
// Press through the forearms to lift the chest into gentle spinal extension while the neck stays long.
import type { SideExercise } from '@/exercise.ts';
import { sphinxPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'sphinx-stretch',
  name: '狮身人面式伸展',
  tl: stretchTL,
  mat: true,
  meta: { en: 'Sphinx Stretch', family: 'stretch-spine', equipment: ['bodyweight', 'mat'], sources: ['hz:1362'] },
  muscles: [{ m: 'lowerBack' }, { m: 'abs', scale: 0.35 }, { m: 'pecs', scale: 0.3 }],
  poster: 0.44,
  pose: (t) => sphinxPose(stretchTL.at(t).p),
} satisfies SideExercise;
