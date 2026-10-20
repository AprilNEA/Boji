// Start seated behind a preacher pad with both upper arms supported and a pronated EZ-bar grip.
// Flex both elbows until the bar reaches shoulder height, then lower while the upper arms stay on the pad.
import type { SideExercise } from '@/exercise.ts';
import { preacherEzBar } from './_biceps-curl-5.ts';

export default preacherEzBar({
  id: 'ez-bar-reverse-preacher-curl', name: '曲杆反握牧师凳弯举', en: 'EZ-Bar Reverse Preacher Curl',
  equipment: ['ez-bar', 'bench'], sources: ['fe:Reverse_Barbell_Preacher_Curls'],
}) satisfies SideExercise;
