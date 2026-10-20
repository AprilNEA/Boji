// Start standing upright with an underhand EZ-bar grip and the elbows close to the torso.
// Curl the bar to shoulder height and lower slowly, without moving the upper arms or torso.
import type { SideExercise } from '@/exercise.ts';
import { standingEzBar } from './_biceps-curl-5.ts';

export default standingEzBar({
  id: 'ez-bar-curl', name: '曲杆弯举', en: 'EZ-Bar Curl',
  equipment: ['ez-bar'], sources: ['hz:0447'],
}) satisfies SideExercise;
