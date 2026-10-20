// Start standing upright with the EZ-bar held at its outer angled handles and elbows beside the torso.
// Curl the bar to shoulder height and lower it, while the upper arms and torso remain still.
import type { SideExercise } from '@/exercise.ts';
import { standingEzBar } from './_biceps-curl-5.ts';

export default standingEzBar({
  id: 'ez-bar-wide-grip-curl', name: '曲杆宽握弯举', en: 'EZ-Bar Wide-Grip Curl',
  equipment: ['ez-bar'], sources: ['fe:EZ-Bar_Curl', 'hz:2741'],
}) satisfies SideExercise;
