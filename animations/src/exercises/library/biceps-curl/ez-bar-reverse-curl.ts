// Start standing upright with the source-specified underhand EZ-bar grip and elbows at the torso.
// Curl the bar to shoulder height and lower under control, while the upper arms remain stationary.
import type { SideExercise } from '@/exercise.ts';
import { standingEzBar } from './_biceps-curl-5.ts';

export default standingEzBar({
  id: 'ez-bar-reverse-curl', name: '曲杆反握弯举', en: 'EZ-Bar Reverse Curl',
  equipment: ['ez-bar'], sources: ['hz:0451'],
}) satisfies SideExercise;
