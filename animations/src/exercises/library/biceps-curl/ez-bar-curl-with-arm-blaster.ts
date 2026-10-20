// Start standing with an arm-blaster plate bracing both upper arms against the torso.
// Curl the EZ-bar to shoulder height, while the brace keeps the elbows and upper arms fixed.
import type { SideExercise } from '@/exercise.ts';
import { standingEzBar } from './_biceps-curl-5.ts';

export default standingEzBar({
  id: 'ez-bar-curl-with-arm-blaster', name: '固定板曲杆弯举', en: 'EZ-Bar Curl with Arm Blaster',
  equipment: ['ez-bar', 'other'], sources: ['hz:2404'],
}, { armBlaster: true }) satisfies SideExercise;
