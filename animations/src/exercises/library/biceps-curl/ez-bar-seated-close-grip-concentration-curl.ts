// Start seated with both feet flat, leaning forward so the elbows brace against the inner thighs.
// Curl the close-grip EZ-bar to the shoulders, while the upper arms stay planted on the thighs.
import type { SideExercise } from '@/exercise.ts';
import { seatedEzBar } from './_biceps-curl-5.ts';

export default seatedEzBar({
  id: 'ez-bar-seated-close-grip-concentration-curl', name: '曲杆坐姿集中弯举', en: 'EZ-Bar Seated Close-Grip Concentration Curl',
  equipment: ['ez-bar', 'bench'], sources: ['hz:1682'],
}, { concentration: true }) satisfies SideExercise;
