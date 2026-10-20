// Start beneath the Smith bar with it across the upper back and the feet well forward of the fixed rail.
// Keep the bar vertical and the heels planted while sitting to parallel, then extend the knees and hips to stand.
import type { SideExercise } from '@/exercise.ts';
import { smithSquat } from './_squat-3.ts';

export default smithSquat({
  id: 'smith-chair-squat', name: '史密斯椅式深蹲', en: 'Smith Chair Squat',
  sources: ['fe:Chair_Squat', 'hz:0750'], chair: true,
}) satisfies SideExercise;
