// Begin in a low plank with elbows near 90 degrees, hands and one toe fixed to the mat.
// Each leg externally rotates and brings its knee toward the same-side elbow before returning.
import type { SideExercise } from '@/exercise.ts';
import { spiderPose } from './_core-stability-1.ts';

export default {
  id: 'bodyweight-spider-plank-knee-drive',
  name: '蜘蛛式平板提膝',
  tl: { total: 4 },
  mat: true,
  meta: { en: 'Bodyweight Spider Plank Knee Drive', family: 'core-stability', equipment: ['bodyweight'], sources: ['fe:Spider_Crawl'] },
  muscles: [
    { m: 'abs', e: () => 0.9 }, { m: 'pecs', scale: 0.45, e: () => 0.62 },
    { m: 'delts', side: 'both', scale: 0.45, e: () => 0.55 }, { m: 'triceps', side: 'both', scale: 0.4, e: () => 0.52 },
  ],
  poster: 0.125,
  pose: spiderPose,
} satisfies SideExercise;
