// Start standing with the feet shoulder-width apart and the arms at the sides.
// Flex the trunk deeply to each side and reach the same-side hand toward the lower leg.
// Keep both feet planted and avoid rotating the torso.
import type { FrontExercise } from '@/exercise.ts';
import { standingSideBend } from './_core-lateral.ts';

const exercise = standingSideBend({
  id: 'bodyweight-alternating-side-toe-touch', name: '自重交替侧屈触脚', en: 'Bodyweight Alternating Side Toe Touch', kind: 'bodyweight', alternating: true, deep: true,
  equipment: ['bodyweight'], sources: ['hz:3213'],
});
export default exercise satisfies FrontExercise;
