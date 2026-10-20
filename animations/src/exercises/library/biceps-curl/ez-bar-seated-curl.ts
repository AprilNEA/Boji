// Start seated upright with both feet flat and the upper arms resting against the thighs.
// Curl the EZ-bar to shoulder level and lower it, while the thighs keep the upper arms stationary.
import type { SideExercise } from '@/exercise.ts';
import { seatedEzBar } from './_biceps-curl-5.ts';

export default seatedEzBar({
  id: 'ez-bar-seated-curl', name: '曲杆坐姿弯举', en: 'EZ-Bar Seated Curl',
  equipment: ['ez-bar', 'bench'], sources: ['hz:1458'],
}) satisfies SideExercise;
