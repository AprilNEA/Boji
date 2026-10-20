// Start standing facing a Smith rail with the bar at waist height and the elbows close to the sides.
// Curl the fixed-path bar upward toward the shoulders, while the upper arms and feet stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { smithCurl } from './_biceps-curl-5.ts';

export default smithCurl({
  id: 'smith-biceps-curl', name: '史密斯二头弯举', en: 'Smith Biceps Curl',
  equipment: ['smith'], sources: ['hz:1683'],
}) satisfies SideExercise;
