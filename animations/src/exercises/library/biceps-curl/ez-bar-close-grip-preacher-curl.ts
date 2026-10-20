// Start seated behind a preacher pad with the chest against it and both upper arms supported.
// Curl the close-grip EZ-bar to shoulder height, while the elbows remain fixed on the pad.
import type { SideExercise } from '@/exercise.ts';
import { preacherEzBar } from './_biceps-curl-5.ts';

export default preacherEzBar({
  id: 'ez-bar-close-grip-preacher-curl', name: '曲杆窄握牧师凳弯举', en: 'EZ-Bar Close-Grip Preacher Curl',
  equipment: ['ez-bar', 'bench'], sources: ['fe:Preacher_Curl', 'hz:1627'],
}) satisfies SideExercise;
