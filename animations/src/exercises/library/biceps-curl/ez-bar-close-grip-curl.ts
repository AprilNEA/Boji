// Start standing tall with the EZ-bar held at the close inner handles and elbows beside the torso.
// Flex both elbows until the bar reaches shoulder level, while the upper arms and feet remain fixed.
import type { FrontExercise } from '@/exercise.ts';
import { frontEzBarCurl } from './_biceps-curl-5.ts';

export default frontEzBarCurl({
  id: 'ez-bar-close-grip-curl', name: '曲杆窄握弯举', en: 'EZ-Bar Close-Grip Curl',
  equipment: ['ez-bar'], sources: ['fe:Close-Grip_EZ_Bar_Curl', 'hz:0446'],
}, 'close') satisfies FrontExercise;
