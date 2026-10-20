// Start on hands and knees with the palms and knees fixed on the mat.
// Pull the belly inward to round the lumbar and thoracic spine, then let the head drop in line with the curve.
import type { SideExercise } from '@/exercise.ts';
import { catPose, stretchTL } from './_stretch-spine.ts';

export default {
  id: 'cat-stretch',
  name: '猫式伸展',
  tl: stretchTL,
  mat: true,
  meta: { en: 'Cat Stretch', family: 'stretch-spine', equipment: ['bodyweight', 'mat'], sources: ['fe:Cat_Stretch'] },
  muscles: [{ m: 'lowerBack' }, { m: 'upperBack', scale: 0.55 }, { m: 'traps', scale: 0.3 }],
  poster: 0.44,
  pose: (t) => catPose(stretchTL.at(t).p),
} satisfies SideExercise;
