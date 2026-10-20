// Stand under the guided bar with it set lower across the rear deltoids and keep the feet planted at shoulder width.
// Hinge the hips back with a forward torso angle to parallel, then extend the hips and knees to stand tall.
import type { SideExercise } from '@/exercise.ts';
import { smithSquat } from './_squat-3.ts';

export default smithSquat({
  id: 'smith-low-bar-squat', name: '史密斯低杠深蹲', en: 'Smith Low-Bar Squat', sources: ['hz:1434'], low: true,
}) satisfies SideExercise;
