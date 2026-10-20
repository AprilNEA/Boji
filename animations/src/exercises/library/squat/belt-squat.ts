// Stand on two separated bench platforms with the belt load hanging freely between the legs.
// Keep the feet planted, descend to a parallel squat, then extend the knees and hips to stand tall.
import type { SideExercise } from '@/exercise.ts';
import { beltSquat } from './_squat-3.ts';

export default beltSquat({
  id: 'belt-squat', name: '腰带深蹲', en: 'Belt Squat', sources: ['fe:Weighted_Squat'],
}) satisfies SideExercise;
