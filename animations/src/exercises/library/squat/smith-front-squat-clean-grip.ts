// Stand with the Smith bar on the front deltoids and collarbones in a clean grip, with the chest lifted.
// Sit down until the thighs reach parallel while the bar stays on its rail, then drive through the heels to stand.
import type { SideExercise } from '@/exercise.ts';
import { smithSquat } from './_squat-3.ts';

export default smithSquat({
  id: 'smith-front-squat-clean-grip', name: '史密斯翻举握法前蹲', en: 'Smith Front Squat Clean Grip',
  sources: ['hz:1433'], front: true,
}) satisfies SideExercise;
