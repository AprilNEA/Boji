// Start seated behind a preacher pad with upper arms supported and the source-specified underhand grip.
// Curl the EZ-bar to shoulder level, while the chest, elbows, and upper arms remain fixed on the pad.
import type { SideExercise } from '@/exercise.ts';
import { preacherEzBar } from './_biceps-curl-5.ts';

export default preacherEzBar({
  id: 'ez-bar-reverse-grip-preacher-curl', name: '曲杆反握牧师凳弯举', en: 'EZ-Bar Reverse-Grip Preacher Curl',
  equipment: ['ez-bar', 'bench'], sources: ['hz:0452'],
}) satisfies SideExercise;
