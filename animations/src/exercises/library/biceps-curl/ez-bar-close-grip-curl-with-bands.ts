// Start standing on the middle of two bands attached to the ends of a close-grip EZ-bar.
// Curl the bar to shoulder height while the feet anchor the bands and the upper arms stay fixed.
import type { SideExercise } from '@/exercise.ts';
import { standingEzBar } from './_biceps-curl-5.ts';

export default standingEzBar({
  id: 'ez-bar-close-grip-curl-with-bands', name: '弹力带曲杆窄握弯举', en: 'EZ-Bar Close-Grip Curl with Bands',
  equipment: ['ez-bar', 'band'], sources: ['fe:Close-Grip_EZ-Bar_Curl_with_Band'],
}, { band: true }) satisfies SideExercise;
